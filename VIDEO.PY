"""
VIDEO.PY - Convert Recorded Session Videos into HAR Training Datasets

Upgraded for TARModel (332-dim features) & 7-Class SOP Architecture:
  - Canonical 332-dim feature extraction (166-dim Pose/Hands/Objects + 166-dim Velocity)
    via `pose_extract_advanced.py`, matching realtime.py and train_tar.py.
  - Automatic discovery of session videos recorded by realtime.py (in `videos/session_*.mp4`).
  - Automatic loading of companion auto-annotations (`session_*_annotations.py`) or timeline CSV.
  - Correct 7-class SOP action mapping (idle, open_box, pick_red, place_red_out, pick_blue, place_blue_in, close_box).
  - Dual dataset export:
      1. Sliding-window array dataset (X.npy, y.npy) in `dataset1/` (or custom folder).
      2. Direct sample export into `dataset_advanced/label_{id}_{idx}.npy` with metadata.csv updated.
  - Millisecond timestamped console logs.

Usage:
    # Process the latest session video recorded by realtime.py:
    python VIDEO.PY

    # Process a specific video:
    python VIDEO.PY --video videos/session_20260910_174456.mp4

    # Process and save samples directly into dataset_advanced/ for retraining:
    python VIDEO.PY --save_to_advanced

    # Specify custom annotations file:
    python VIDEO.PY --video test1.mp4 --annotations videos/session_20260910_174456_annotations.py
"""

import os
import sys
import glob
import time
import argparse
import importlib.util
from datetime import datetime
import numpy as np
import cv2

# Project root setup
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from model_def import SEQ_LEN, FEATURE_DIM, NUM_CLASSES
import feature_utils as fu
from pose_extract_advanced import (
    extract_base_features, resample_base_sequence, add_velocity,
    next_sample_index, ensure_metadata, append_metadata,
    BASE_DIM, TOTAL_DIM, ACTIONS, LABEL_NAMES
)

# ==============================================================================
# DEFAULT CONFIG
# ==============================================================================
DEFAULT_VIDEO_PATH = "test1.mp4"
DEFAULT_SAVE_DIR = "dataset1"
DEFAULT_ADVANCED_DIR = "dataset_advanced"
FLIP_FRAME = False   # Set to False because realtime.py records unflipped frames

# Default 7-class action timeline fallback (in frames)
DEFAULT_ANNOTATIONS = [
    (0, 40, "idle"),
    (40, 90, "open_box"),
    (90, 150, "pick_red"),
    (150, 210, "place_red_out"),
    (210, 270, "pick_blue"),
    (270, 330, "place_blue_in"),
    (330, 380, "close_box"),
]

# Standard 7-class mapping (0 to 6) with legacy aliases
LABEL_MAP = {
    "idle": 0,
    "open_box": 1,
    "pick_red": 2,
    "place_red_out": 3,
    "remove_from_box": 3,     # legacy alias
    "pick_blue": 4,
    "place_blue_in": 5,
    "place_in_box": 5,        # legacy alias
    "place_red_in": 3,        # legacy alias
    "close_box": 6,
}


def ts_now_str():
    """Returns current local time as HH:MM:SS.mmm string."""
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]


def ts_print(msg):
    """Prints message to stdout with millisecond timestamp prefix."""
    print(f"[{ts_now_str()}] {msg}")


def find_latest_session_video():
    """Finds the most recently recorded session video in videos/ or project root."""
    search_dirs = [os.path.join(PROJECT_ROOT, "videos"), PROJECT_ROOT]
    candidates = []
    for d in search_dirs:
        if os.path.isdir(d):
            for pat in ["session_*.mp4", "session_*.avi", "*.mp4"]:
                for f in glob.glob(os.path.join(d, pat)):
                    candidates.append((os.path.getmtime(f), f))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]
    return None


def load_external_annotations(annot_path):
    """Loads annotations list from an auto-generated _annotations.py file."""
    if not os.path.exists(annot_path):
        return None
    try:
        spec = importlib.util.spec_from_file_location("annot_module", annot_path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        if hasattr(mod, "annotations"):
            ts_print(f"[ANNOT] Loaded {len(mod.annotations)} annotation segments from: {annot_path}")
            return mod.annotations
    except Exception as e:
        ts_print(f"[WARN] Failed to load annotations from {annot_path}: {e}")
    return None


def get_label_for_frame(frame_idx, annotations_list):
    """Returns the action label corresponding to a given frame index."""
    for start, end, label in annotations_list:
        if start <= frame_idx < end:
            return label
    return "idle"


# ==============================================================================
# MEDIAPIPE INITIALIZATION
# ==============================================================================
def init_mediapipe():
    try:
        import mediapipe as mp
        mp_pose = mp.solutions.pose
        mp_hands = mp.solutions.hands
    except AttributeError:
        raise RuntimeError(
            "This mediapipe installation does not expose `mp.solutions`. "
            "Please run with the project virtualenv: .\\venv\\Scripts\\python.exe"
        )

    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    hands = mp_hands.Hands(
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    return pose, hands


# ==============================================================================
# VIDEO PROCESSING & FEATURE EXTRACTION
# ==============================================================================
def process_video_to_features(video_path, flip_frame=False):
    """
    Extracts canonical 332-dim features frame-by-frame:
      - 166-dim Base: Pose(66) + Hands(84) + Boxes(9) + Distances(6) + Lid(1)
      - 166-dim Velocity: frame[t] - frame[t-1]
    Returns:
      base_frames: list of 166-dim vectors
      feat_332_frames: list of 332-dim vectors
      total_frames: int
    """
    pose, hands = init_mediapipe()

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    total_cap_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    ts_print(f"[INFO] Processing video: {video_path} ({total_cap_frames} frames, {fps:.1f} FPS, flip={flip_frame})")

    base_frames = []
    feat_332_frames = []
    prev_base = None
    frame_idx = 0

    t0 = time.time()
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if flip_frame:
            frame = cv2.flip(frame, 1)

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pose_res = pose.process(rgb)
        hands_res = hands.process(rgb)

        # Canonical 166-dim base feature extraction with box detector & body exclusion
        base, _, _, _, _ = extract_base_features(pose_res, hands_res, frame, override_boxes=None)

        # 166-dim velocity
        if prev_base is None:
            velocity = np.zeros(BASE_DIM, dtype=np.float32)
        else:
            velocity = base - prev_base
        prev_base = base.copy()

        # Concatenate 166 base + 166 velocity -> 332 total feature vector
        feat_332 = np.concatenate([base, velocity])

        base_frames.append(base)
        feat_332_frames.append(feat_332)
        frame_idx += 1

        if frame_idx % 50 == 0 or frame_idx == total_cap_frames:
            elapsed = time.time() - t0
            fps_proc = frame_idx / elapsed if elapsed > 0 else 0
            sys.stdout.write(f"\r[{ts_now_str()}] Extracted {frame_idx}/{total_cap_frames} frames ({fps_proc:.1f} FPS)...")
            sys.stdout.flush()

    cap.release()
    print()  # newline after progress
    ts_print(f"[OK] Completed extraction: {len(feat_332_frames)} frames in {time.time() - t0:.1f}s")
    return base_frames, feat_332_frames


# ==============================================================================
# MAIN
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(description="Convert recorded session video to TAR dataset.")
    parser.add_argument("--video", default=None, help="Path to input video (.mp4/.avi)")
    parser.add_argument("--annotations", default=None, help="Path to companion annotations .py file")
    parser.add_argument("--save_dir", default=DEFAULT_SAVE_DIR, help="Directory to save X.npy and y.npy (default: dataset1)")
    parser.add_argument("--save_to_advanced", action="store_true", help="Also save individual samples directly to dataset_advanced/ for retrain_tar.py")
    parser.add_argument("--flip", action="store_true", help="Horizontally flip video frames during extraction")
    parser.add_argument("--stride", type=int, default=1, help="Sliding window step stride (default: 1)")
    args = parser.parse_args()

    # 1. Resolve video path
    video_path = args.video
    if not video_path:
        video_path = find_latest_session_video()
        if video_path and os.path.exists(video_path):
            ts_print(f"[AUTO] Detected latest session video: {video_path}")
        else:
            video_path = DEFAULT_VIDEO_PATH

    if not os.path.exists(video_path):
        ts_print(f"[ERROR] Video file not found: {video_path}")
        ts_print("Please record a video in realtime.py (saved in videos/) or provide --video path.")
        return

    # 2. Resolve annotations
    annotations_list = None
    if args.annotations and os.path.exists(args.annotations):
        annotations_list = load_external_annotations(args.annotations)

    if annotations_list is None:
        # Check if companion _annotations.py exists next to video
        cand_annot = video_path.rsplit(".", 1)[0] + "_annotations.py"
        if os.path.exists(cand_annot):
            annotations_list = load_external_annotations(cand_annot)

    if annotations_list is None:
        ts_print("[INFO] No companion annotations found. Using default 7-class SOP timeline.")
        annotations_list = DEFAULT_ANNOTATIONS

    # 3. Process video into 332-dim features
    base_frames, feat_332_frames = process_video_to_features(video_path, flip_frame=args.flip)

    total_frames = len(feat_332_frames)
    if total_frames < SEQ_LEN:
        ts_print(f"[ERROR] Video has only {total_frames} frames (< {SEQ_LEN} required for TAR model sequence).")
        return

    # 4. Mode A: Create Sliding Window Dataset (X.npy, y.npy) in save_dir
    ts_print(f"[INFO] Generating sliding-window dataset (stride={args.stride}, window={SEQ_LEN})...")
    data_list = []
    labels_list = []

    for i in range(0, total_frames - SEQ_LEN + 1, args.stride):
        window = feat_332_frames[i : i + SEQ_LEN]
        center_frame = i + SEQ_LEN // 2
        label_name = get_label_for_frame(center_frame, annotations_list)
        label_id = LABEL_MAP.get(label_name, 0)

        data_list.append(window)
        labels_list.append(label_id)

    X = np.array(data_list, dtype=np.float32)
    y = np.array(labels_list, dtype=np.int64)

    os.makedirs(args.save_dir, exist_ok=True)
    x_path = os.path.join(args.save_dir, "X.npy")
    y_path = os.path.join(args.save_dir, "y.npy")
    np.save(x_path, X)
    np.save(y_path, y)

    ts_print(f"[SAVED] Sliding-window dataset saved to '{args.save_dir}':")
    ts_print(f"   - X.npy: {X.shape} (Expected: (N, {SEQ_LEN}, {FEATURE_DIM}))")
    ts_print(f"   - y.npy: {y.shape}")

    # Print class distribution
    unique, counts = np.unique(y, return_counts=True)
    dist_str = ", ".join([f"{fu.LABELS[cls] if cls < len(fu.LABELS) else cls}: {cnt}" for cls, cnt in zip(unique, counts)])
    ts_print(f"   - Class distribution: {dist_str}")

    # 5. Mode B (Optional / Recommended): Save canonical action samples directly into dataset_advanced/
    if args.save_to_advanced:
        ts_print(f"[INFO] Exporting segmented actions directly into '{DEFAULT_ADVANCED_DIR}' for retraining...")
        ensure_metadata()
        saved_samples = 0

        for start_f, end_f, label_name in annotations_list:
            if label_name == "idle" or label_name not in LABEL_MAP:
                continue

            label_id = LABEL_MAP[label_name]
            seg_base = base_frames[max(0, start_f) : min(total_frames, end_f)]
            if len(seg_base) < 8:
                continue

            # Resample segment uniformly to 48 frames and recompute canonical velocity
            resampled_base = resample_base_sequence(seg_base, SEQ_LEN)
            sample_332 = add_velocity(resampled_base)  # shape (48, 332)

            idx = next_sample_index(label_id)
            fname = f"label_{label_id}_{idx}.npy"
            out_path = os.path.join(DEFAULT_ADVANCED_DIR, fname)
            np.save(out_path, sample_332)

            append_metadata([
                fname, label_id, label_name,
                "1.00", "1.00", "1.00",
                len(seg_base), ts_now_str()
            ])
            saved_samples += 1
            ts_print(f"   [SAVED] {fname} ({label_name}, {len(seg_base)} frames -> 48 resampled)")

        ts_print(f"[OK] Added {saved_samples} new action samples to '{DEFAULT_ADVANCED_DIR}'!")
        ts_print(f"You can now fine-tune immediately with: python retrain_tar.py --dataset_path {DEFAULT_ADVANCED_DIR}")


if __name__ == "__main__":
    main()