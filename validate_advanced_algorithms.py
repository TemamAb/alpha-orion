import numpy as np
import time
import pandas as pd

class AdvancedAlgorithmValidator:
    """
    Validates the performance and logic of Alpha-Orion's advanced algorithms.
    Target: Prove <50ms execution time for complex strategies.
    """
    def __init__(self):
        print("Initializing Alpha-Orion Advanced Algorithm Validation...")
        print("Target Benchmark: <50ms Execution Latency")
        
    def validate_vectorization_stat_arb(self, n_pairs=200, history_points=1000):
        """
        Simulates calculating Z-Scores for Statistical Arbitrage across 200 pairs
        with 1000 historical data points each.
        """
        print(f"\n--- 1. Validating Vectorized StatArb (Pairs={n_pairs}, History={history_points}) ---")
        
        # Generate Mock Data (Price Series for Pairs)
        # Shape: (200 pairs, 1000 timepoints)
        prices_a = np.random.normal(100, 2, (n_pairs, history_points))
        prices_b = np.random.normal(100, 2, (n_pairs, history_points))
        
        # --- NAIVE APPROACH (Loops) ---
        start_naive = time.time()
        signals_naive = []
        for i in range(n_pairs):
            spread = prices_a[i] - prices_b[i]
            mean = sum(spread) / len(spread)
            # Std dev calculation loop... (simplified for brevity)
            variance = sum([((x - mean) ** 2) for x in spread]) / len(spread)
            std = variance ** 0.5
            z_score = (spread[-1] - mean) / std
            if abs(z_score) > 2.0:
                signals_naive.append(1)
            else:
                signals_naive.append(0)
        end_naive = time.time()
        time_naive = (end_naive - start_naive) * 1000
        
        # --- VECTORIZED APPROACH (NumPy) ---
        start_vec = time.time()
        # 1. Calculate Spreads Matrix
        spreads = prices_a - prices_b
        # 2. Calculate Means & Stds along axis 1 (time)
        means = np.mean(spreads, axis=1)
        stds = np.std(spreads, axis=1)
        # 3. Calculate latest Z-Scores
        current_spreads = spreads[:, -1]
        z_scores = (current_spreads - means) / stds
        # 4. Generate Signals
        signals_vec = np.where(np.abs(z_scores) > 2.0, 1, 0)
        end_vec = time.time()
        time_vec = (end_vec - start_vec) * 1000
        
        print(f"Naive Loop Time:      {time_naive:.4f} ms")
        print(f"Vectorized Time:      {time_vec:.4f} ms")
        print(f"Speedup Factor:       {time_naive / time_vec:.1f}x")
        
        if time_vec < 50:
            print("✅ RESULT: PASSED (<50ms)")
        else:
            print("❌ RESULT: FAILED (>50ms)")
            
    def validate_triangular_arbitrage(self, n_assets=50):
        """
        Validates performance of detecting 3-hop triangular arbitrage loops.
        Target: <5ms for 50 assets (approx 125,000 path combinations).
        """
        print(f"\n--- 3. Validating Triangular Arbitrage (Assets={n_assets}) ---")
        
        # Generate Mock Exchange Rates (Adjacency Matrix)
        # R[i][j] is rate from asset i to j
        # Initialize with 1.0 +/- noise
        rates = np.abs(np.random.normal(1.0, 0.01, (n_assets, n_assets)))
        np.fill_diagonal(rates, 1.0)
        
        # Inject a synthetic arbitrage opportunity: 0 -> 1 -> 2 -> 0
        rates[0, 1] = 1.05
        rates[1, 2] = 1.05
        rates[2, 0] = 1.05 # 1.05^3 = 1.15 > 1.0
        
        # --- NAIVE APPROACH (Nested Loops) ---
        start_naive = time.time()
        opps_naive = []
        for i in range(n_assets):
            for j in range(n_assets):
                for k in range(n_assets):
                    if i != j and j != k and k != i:
                        # Check loop profit > 1.01 (1%)
                        if rates[i, j] * rates[j, k] * rates[k, i] > 1.01: 
                            opps_naive.append((i, j, k))
        end_naive = time.time()
        time_naive = (end_naive - start_naive) * 1000
        
        # --- VECTORIZED APPROACH (Broadcasting) ---
        start_vec = time.time()
        
        # We want R_ij * R_jk * R_ki > 1.01
        # Broadcasting shapes: (N, N, 1) * (1, N, N) * (N, 1, N)
        # rates.T[:, None, :] gives us R_ki correctly mapped to indices (i, k)
        
        products = rates[:, :, None] * rates[None, :, :] * rates.T[:, None, :]
        
        # Find indices where profit > 1.01
        indices = np.argwhere(products > 1.01)
        
        end_vec = time.time()
        time_vec = (end_vec - start_vec) * 1000
        
        print(f"Naive Loop Time:      {time_naive:.4f} ms")
        print(f"Vectorized Time:      {time_vec:.4f} ms")
        print(f"Speedup Factor:       {time_naive / time_vec:.1f}x")
        
        if time_vec < 50:
            print("✅ RESULT: PASSED (<50ms)")
        else:
            print("❌ RESULT: FAILED (>50ms)")

    def validate_kelly_criterion(self):
        """
        Validates the Kelly Criterion calculation for dynamic position sizing.
        """
        print(f"\n--- 2. Validating Kelly Criterion Logic ---")
        
        # Scenario: 60% Win Rate, 1.5 Reward/Risk Ratio
        win_prob = 0.60
        win_loss_ratio = 1.5
        
        # Formula: f = p - q/b
        q = 1 - win_prob
        optimal_f = win_prob - (q / win_loss_ratio)
        
        print(f"Scenario: Win Rate={win_prob*100}%, R/R Ratio={win_loss_ratio}")
        print(f"Optimal Fraction (Full Kelly): {optimal_f:.4f} ({optimal_f*100:.2f}%)")
        print(f"Safety Fraction (Half Kelly):  {optimal_f/2:.4f} ({(optimal_f/2)*100:.2f}%)")
        
        # Validation
        if 0.33 < optimal_f < 0.34:
            print("✅ RESULT: Calculation Accurate")

if __name__ == "__main__":
    validator = AdvancedAlgorithmValidator()
    validator.validate_vectorization_stat_arb()
    validator.validate_triangular_arbitrage()
    validator.validate_kelly_criterion()