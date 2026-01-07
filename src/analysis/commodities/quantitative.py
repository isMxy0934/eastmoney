"""
Quantitative Analysis Module for Commodities
============================================
Provides backtesting and statistical analysis for Gold/Silver strategies.
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple

class QuantitativeAnalyst:
    """
    Performs quantitative analysis and backtesting on commodity data.
    """
    
    @staticmethod
    def backtest_gold_silver_ratio(
        ratio_series: pd.Series, 
        target_asset_price: pd.Series, 
        signal_threshold: float, 
        signal_type: str = 'above',
        holding_period: int = 30
    ) -> Dict:
        """
        Backtest a mean reversion strategy based on Gold/Silver Ratio.
        
        Args:
            ratio_series: Historical Gold/Silver ratio.
            target_asset_price: Historical price of the asset to trade (e.g., Silver).
            signal_threshold: Threshold to trigger signal (e.g., 80).
            signal_type: 'above' (buy when ratio > threshold) or 'below'.
            holding_period: Days to hold the position.
            
        Returns:
            Dict containing win rate, average return, etc.
        """
        if ratio_series.empty or target_asset_price.empty:
            return {"error": "No data"}
            
        # Align data
        df = pd.DataFrame({
            'ratio': ratio_series,
            'price': target_asset_price
        }).dropna()
        
        if df.empty:
            return {"error": "No aligned data"}
            
        # Generate Signals
        if signal_type == 'above':
            # Signal: Ratio crosses above threshold (or is just above? 
            # Mean reversion usually means: if ratio is high, Silver is cheap relative to Gold -> Buy Silver)
            # Let's use "is above" for simplicity, or "crosses above". 
            # "Crosses above" is better to avoid continuous signals.
            # But strictly for "Regime", we can check all days where ratio > 80.
            # Let's check "Crosses Above" to identify entry points.
            df['signal'] = (df['ratio'] > signal_threshold) & (df['ratio'].shift(1) <= signal_threshold)
        else:
            df['signal'] = (df['ratio'] < signal_threshold) & (df['ratio'].shift(1) >= signal_threshold)
            
        entry_dates = df[df['signal']].index
        
        results = []
        for date in entry_dates:
            # Find the index of the date
            try:
                idx = df.index.get_loc(date)
                if idx + holding_period < len(df):
                    entry_price = df['price'].iloc[idx]
                    exit_price = df['price'].iloc[idx + holding_period]
                    ret = (exit_price - entry_price) / entry_price
                    results.append(ret)
            except Exception:
                continue
                
        if not results:
            return {
                "signal_count": 0,
                "win_rate": 0.0,
                "avg_return": 0.0,
                "max_return": 0.0,
                "min_return": 0.0
            }
            
        results_series = pd.Series(results)
        win_rate = (results_series > 0).mean() * 100
        
        return {
            "signal_count": len(results),
            "win_rate": round(win_rate, 2),
            "avg_return": round(results_series.mean() * 100, 2),
            "max_return": round(results_series.max() * 100, 2),
            "min_return": round(results_series.min() * 100, 2)
        }
