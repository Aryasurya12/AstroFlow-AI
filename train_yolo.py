"""
Fine-tune YOLOv8 on your annotated red_box / blue_box / main_box dataset.

Usage:
    python train_yolo.py
    python train_yolo.py --data boxes_dataset/data.yaml --epochs 80

After training, best weights are copied to yolo_boxes.pt (used by realtime.py).
"""

import os
import shutil
import argparse
import sys

# ==============================================================================
# CONFIG
# ==============================================================================
DEFAULT_DATA    = "boxes_dataset/data.yaml"   # Roboflow export location
DEFAULT_BASE    = "yolov8n.pt"                # Starting weights (smallest, fastest)
DEFAULT_EPOCHS  = 50
DEFAULT_IMGSZ   = 640
DEFAULT_BATCH   = 8                           # Reduce to 4 if you get OOM on CPU
DEFAULT_NAME    = "tar_boxes"
OUTPUT_WEIGHTS  = "yolo_boxes.pt"            # Where realtime.py loads from

EXPECTED_CLASSES = {"red_box", "blue_box", "main_box"}


# ==============================================================================
# VALIDATION
# ==============================================================================
def validate_yaml(yaml_path):
    if not os.path.exists(yaml_path):
        print(f"[ERROR] data.yaml not found at '{yaml_path}'")
        print("  -> Download your Roboflow export (YOLOv8 format) and extract it to boxes_dataset/")
        return False

    import yaml
    with open(yaml_path, "r") as f:
        cfg = yaml.safe_load(f)

    names = set(cfg.get("names", []))
    missing = EXPECTED_CLASSES - names
    extra   = names - EXPECTED_CLASSES

    if missing:
        print(f"[ERROR] data.yaml missing classes: {missing}")
        print("  -> Check spelling in Roboflow: must be red_box, blue_box, main_box")
        return False
    if extra:
        print(f"[WARN] Extra unexpected classes in data.yaml: {extra}")

    print(f"[YAML] Classes ({cfg.get('nc')}): {cfg.get('names')}")
    print(f"[YAML] Train: {cfg.get('train')} | Val: {cfg.get('val')}")
    return True


# ==============================================================================
# TRAINING
# ==============================================================================
def train(data, base_model, epochs, imgsz, batch, name):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    print("=" * 60)
    print("  YOLOv8 Fine-Tuning -- TAR Box Detection")
    print("=" * 60)
    print(f"  Base model : {base_model}")
    print(f"  Dataset    : {data}")
    print(f"  Epochs     : {epochs}  |  ImgSz: {imgsz}  |  Batch: {batch}")
    print("=" * 60)

    model = YOLO(base_model)
    model.train(
        data=data,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        name=name,
        patience=15,
        save=True,
        plots=True,
        verbose=True,
    )

    best_path = os.path.join("runs", "detect", name, "weights", "best.pt")
    if os.path.exists(best_path):
        shutil.copy(best_path, OUTPUT_WEIGHTS)
        print(f"\n[DONE] Best weights copied to '{OUTPUT_WEIGHTS}'")
        print("[DONE] realtime.py will now use your custom box detector.")
    else:
        print(f"\n[WARN] Could not find best.pt at '{best_path}' -- check runs/detect/{name}/weights/")

    return best_path


# ==============================================================================
# SANITY CHECK
# ==============================================================================
def sanity_check():
    from ultralytics import YOLO
    video_dir = "videos"
    videos = [f for f in os.listdir(video_dir) if f.lower().endswith((".mp4", ".avi", ".mov"))] \
             if os.path.exists(video_dir) else []
    if not videos:
        print("[SKIP] No videos in videos/ -- skipping sanity check.")
        return
    test_video = os.path.join(video_dir, videos[0])
    print(f"\n[SANITY] Running on '{test_video}'...")
    model = YOLO(OUTPUT_WEIGHTS)
    print(f"[SANITY] Model classes: {model.names}")
    model(test_video, save=True, conf=0.25, verbose=False)
    print("[SANITY] Output saved to runs/detect/predict/ -- open to verify detections.")


# ==============================================================================
# MAIN
# ==============================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune YOLOv8 for TAR box detection.")
    parser.add_argument("--data",        type=str, default=DEFAULT_DATA)
    parser.add_argument("--model",       type=str, default=DEFAULT_BASE)
    parser.add_argument("--epochs",      type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--imgsz",       type=int, default=DEFAULT_IMGSZ)
    parser.add_argument("--batch",       type=int, default=DEFAULT_BATCH)
    parser.add_argument("--name",        type=str, default=DEFAULT_NAME)
    parser.add_argument("--skip-sanity", action="store_true")
    args = parser.parse_args()

    if not validate_yaml(args.data):
        sys.exit(1)

    train(args.data, args.model, args.epochs, args.imgsz, args.batch, args.name)

    if not args.skip_sanity and os.path.exists(OUTPUT_WEIGHTS):
        sanity_check()
