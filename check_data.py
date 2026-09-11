import os, numpy as np
files = [f for f in os.listdir('dataset') if f.endswith('.npy')][:5]
for f in files:
    p = os.path.join('dataset', f)
    print(f"{f}: shape={np.load(p).shape}")
total = len([f for f in os.listdir('dataset') if f.endswith('.npy')])
print(f"Total .npy files: {total}")
