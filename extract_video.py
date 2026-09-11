import cv2
import numpy as np
import torch
import os
from collections import deque
import mediapipe as mp
import feature_utils as fu
from model_def import TARModel, NUM_CLASSES, FEATURE_DIM, SEQ_LEN

# =========================
# CONFIG
# =========================
MODEL_PATH = "best_tar_model.pth"
VIDEO_PATH = "test1.mp4"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
CONFIDENCE_THRESHOLD = 0.40

# =========================
# LOAD MODEL
# =========================
model = TARModel(input_size=FEATURE_DIM, num_classes=NUM_CLASSES).to(DEVICE)
if os.path.exists(MODEL_PATH):
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        model.eval()
        print(f"[MODEL] Successfully loaded model weights from {MODEL_PATH}")
    except Exception as e:
        print(f"[MODEL WARN] Could not load {MODEL_PATH} ({e}). Retrying with uninitialized weights.")
        model.eval()
else:
    print(f"[MODEL WARN] {MODEL_PATH} not found. Please train model using train_tar.py.")
    model.eval()

# =========================
# MEDIAPIPE INITIALIZATION
# =========================
mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

pose_detector = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
hands_detector = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.5, min_tracking_confidence=0.5)

# =========================
# VIDEO INFERENCE LOOP
# =========================
def run_video_inference(video_source=VIDEO_PATH):
    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        print(f"[ERROR] Could not open video source: {video_source}")
        return

    sequence = deque(maxlen=SEQ_LEN)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    print(f"[INFERENCE] Processing video '{video_source}' at {fps:.1f} FPS...")

    current_label = "buffering..."
    current_conf = 0.0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        display_frame = frame.copy()
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # 1. Process MediaPipe
        pose_res = pose_detector.process(rgb_frame)
        hands_res = hands_detector.process(rgb_frame)

        # 2. Color Detection
        color_dets = fu.detect_color_objects(frame)
        for cname, dinfo in color_dets.items():
            bx, by, bw, bh = dinfo["box"]
            box_color = (0, 0, 255) if cname == "red" else (255, 100, 0)  # red / blue
            cv2.rectangle(display_frame, (bx, by), (bx + bw, by + bh), box_color, 2)
            cv2.putText(display_frame, f"{cname.upper()}", (bx, max(20, by - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, box_color, 2)

        # 3. Extract Features (320-dim object-aware + velocity)
        h_frame, w_frame = frame.shape[:2]
        features = fu.extract_full_features(pose_res, hands_res, color_dets, w_frame, h_frame)
        sequence.append(features)

        # 4. Draw Landmarks
        if pose_res.pose_landmarks:
            mp_drawing.draw_landmarks(
                display_frame,
                pose_res.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
            )
        if hands_res.multi_hand_landmarks:
            for hand_lms in hands_res.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    display_frame,
                    hand_lms,
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing_styles.get_default_hand_landmarks_style(),
                    mp_drawing_styles.get_default_hand_connections_style()
                )

        # 5. Temporal Action Prediction
        if len(sequence) == SEQ_LEN:
            data = np.array(sequence, dtype=np.float32)

            # Per-window z-score normalization
            mean = np.mean(data)
            std = np.std(data) + 1e-6
            norm_data = (data - mean) / std
            norm_data = np.clip(norm_data, -5.0, 5.0)

            tensor = torch.tensor(norm_data, dtype=torch.float32).unsqueeze(0).to(DEVICE)

            with torch.no_grad():
                logits = model(tensor)
                probs = torch.softmax(logits, dim=1).squeeze(0)
                pred_idx = torch.argmax(probs).item()
                current_conf = probs[pred_idx].item()

                if current_conf >= CONFIDENCE_THRESHOLD:
                    current_label = fu.LABELS[pred_idx]
                else:
                    current_label = f"{fu.LABELS[pred_idx]} (uncertain)"

        # 6. UI Overlay
        h, w = display_frame.shape[:2]
        cv2.rectangle(display_frame, (0, 0), (w, 60), (20, 20, 20), -1)
        
        status_text = f"Action: {current_label.upper()} ({current_conf * 100:.1f}%)" if len(sequence) == SEQ_LEN else f"Buffering ({len(sequence)}/{SEQ_LEN})..."
        status_color = (0, 255, 0) if current_conf >= 0.70 else (0, 255, 255) if current_conf >= CONFIDENCE_THRESHOLD else (180, 180, 180)
        cv2.putText(display_frame, status_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, status_color, 2)

        cv2.imshow("TAR Video Test", display_frame)

        key = cv2.waitKey(int(1000 / fps)) & 0xFF
        if key == 27 or key == ord('q'):  # ESC or Q
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    run_video_inference()