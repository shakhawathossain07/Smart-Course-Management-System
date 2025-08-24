# pip install matplotlib numpy

from time import perf_counter
import random
import statistics
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
import textwrap
import os

# ---------- Sorting algorithm implementations ----------

def insertion_sort(arr):
    a = arr  # in-place
    for i in range(1, len(a)):
        key = a[i]
        j = i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = key
    return a

def merge_sort(arr):
    if len(arr) <= 1:
        return arr[:]
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    merged = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i]); i += 1
        else:
            merged.append(right[j]); j += 1
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged

def heapify(arr, n, i):
    largest = i
    l = 2*i + 1
    r = 2*i + 2
    if l < n and arr[l] > arr[largest]:
        largest = l
    if r < n and arr[r] > arr[largest]:
        largest = r
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)

def heap_sort(arr):
    a = arr
    n = len(a)
    for i in range(n//2 - 1, -1, -1):
        heapify(a, n, i)
    for i in range(n - 1, 0, -1):
        a[0], a[i] = a[i], a[0]
        heapify(a, i, 0)
    return a

def quick_sort(arr):
    # in-place optimized Lomuto-style with random pivot would be better; use recursive extra-space version for clarity
    if len(arr) <= 1:
        return arr[:]
    pivot = arr[len(arr)//2]
    left = [x for x in arr if x < pivot]
    mid = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + mid + quick_sort(right)

# ---------- Experiment setup ----------

random_seed = 42
random.seed(random_seed)

# dataset sizes chosen to show differences, but keep insertion sort limited to smaller sizes.
dataset_sizes_insertion = [100, 300, 500, 800, 1200]
dataset_sizes_others = [100, 500, 1000, 2000, 5000, 10000]

trials = 5

algorithms = {
    "Insertion Sort": insertion_sort,
    "Merge Sort": merge_sort,
    "Heap Sort": heap_sort,
    "Quick Sort": quick_sort
}

# We'll store results as: results[algo][size] = average_time
results = {name: {} for name in algorithms.keys()}

# Helper to verify correctness
def is_sorted(a):
    return all(a[i] <= a[i+1] for i in range(len(a)-1))

# Run experiments
print("Running experiments... (this may take a short while)")

# Insertion sort experiments (smaller sizes)
for size in dataset_sizes_insertion:
    times = []
    for t in range(trials):
        data = [random.randint(1, 10**6) for _ in range(size)]
        arr_copy = data.copy()
        start = perf_counter()
        insertion_sort(arr_copy)
        end = perf_counter()
        assert is_sorted(arr_copy)
        times.append(end - start)
    results["Insertion Sort"][size] = statistics.mean(times)

# Other sorts experiments
for size in dataset_sizes_others:
    for name in ["Merge Sort", "Heap Sort", "Quick Sort"]:
        times = []
        for t in range(trials):
            data = [random.randint(1, 10**6) for _ in range(size)]
            arr_copy = data.copy()
            start = perf_counter()
            # For heap_sort and insertion_sort we sort in-place; merge and quick return new lists.
            out = algorithms[name](arr_copy)
            end = perf_counter()
            # ensure sorted
            if name in ("Merge Sort", "Quick Sort"):
                assert is_sorted(out)
            else:
                assert is_sorted(arr_copy)
            times.append(end - start)
        results[name][size] = statistics.mean(times)

# ---------- Prepare plots ----------
plot_path = "sorting_performance.png"
plt.figure(figsize=(10,6))
# collect unified list of sizes for x-axis (we'll plot each algorithm across available sizes; insertion will not have large sizes)
all_sizes = sorted(set(dataset_sizes_insertion + dataset_sizes_others))
for name in algorithms.keys():
    sizes = sorted(results[name].keys())
    times = [results[name][s] for s in sizes]
    plt.plot(sizes, times, marker='o', label=name)
plt.xlabel("Dataset size (n)")
plt.ylabel("Average execution time (seconds)")
plt.title("Sorting Algorithm Performance (averaged over {} trials)".format(trials))
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig(plot_path, dpi=300, bbox_inches='tight')
plt.show()  # This will display the plot
# Don't close immediately - let user see the plot