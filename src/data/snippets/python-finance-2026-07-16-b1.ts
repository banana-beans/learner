import { Snippet } from "./types";

export const pythonFinanceSnippets20260716B1: Snippet[] = [
  {
    id: "pyfin-20260716-b1-kalman-pairs",
    language: "python",
    tag: "finance",
    title: "Kalman Filter Pairs Trading (dynamic hedge ratio)",
    code: `\`\`\`python
import numpy as np

def kalman_pairs(y: np.ndarray, x: np.ndarray,
                 delta: float = 1e-4, R_var: float = 1e-3):
    """Track dynamic hedge ratio beta via Kalman filter."""
    n = len(y)
    beta = np.zeros(n)
    P = 1.0          # state variance
    Q = delta / (1 - delta)  # process noise

    beta[0] = y[0] / x[0] if x[0] != 0 else 1.0
    for t in range(1, n):
        # predict
        P_pred = P + Q
        # observation H = [x[t], 1]; scalar case: H = x[t]
        H = x[t]
        S = H * P_pred * H + R_var   # innovation variance
        K = P_pred * H / S           # Kalman gain
        # update
        yhat = H * beta[t - 1]
        beta[t] = beta[t - 1] + K * (y[t] - yhat)
        P = (1 - K * H) * P_pred

    spread = y - beta * x
    z_score = (spread - spread.mean()) / spread.std()
    return beta, spread, z_score
\`\`\``,
    explanation:
      "Adapts the hedge ratio in real time using a 1-D Kalman filter. The state is beta, observation noise R captures price tick noise, process noise Q controls how fast beta may drift. The resulting spread and its z-score drive mean-reversion entries.",
  },
  {
    id: "pyfin-20260716-b1-garch11-mle",
    language: "python",
    tag: "finance",
    title: "GARCH(1,1) MLE Estimation",
    code: `\`\`\`python
import numpy as np
from scipy.optimize import minimize

def garch11_mle(returns: np.ndarray):
    """Fit GARCH(1,1) by maximum likelihood."""
    def neg_log_lik(params):
        omega, alpha, beta = params
        if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
            return 1e10
        n = len(returns)
        sigma2 = np.zeros(n)
        sigma2[0] = np.var(returns)
        for t in range(1, n):
            sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]
        ll = -0.5 * np.sum(np.log(2 * np.pi * sigma2) + returns**2 / sigma2)
        return -ll

    x0 = [1e-6, 0.1, 0.85]
    bounds = [(1e-9, None), (0, 1), (0, 1)]
    res = minimize(neg_log_lik, x0, method="L-BFGS-B", bounds=bounds)
    omega, alpha, beta = res.x
    long_run_vol = np.sqrt(omega / (1 - alpha - beta)) * np.sqrt(252)
    return {"omega": omega, "alpha": alpha, "beta": beta,
            "persistence": alpha + beta, "annualised_vol": long_run_vol}
\`\`\``,
    explanation:
      "Fits GARCH(1,1) by numerical MLE using L-BFGS-B. The log-likelihood sums Gaussian densities with time-varying conditional variance sigma^2_t = omega + alpha*r^2_{t-1} + beta*sigma^2_{t-1}. Returns persistence alpha+beta (near 1 = long memory) and annualised long-run volatility.",
  },
  {
    id: "pyfin-20260716-b1-merton-jump",
    language: "python",
    tag: "finance",
    title: "Merton Jump-Diffusion Option Pricing",
    code: `\`\`\`python
import numpy as np
from scipy.stats import norm, poisson

def merton_call(S, K, T, r, sigma, lam, mu_j, sigma_j, n_terms=50):
    """Price European call under Merton jump-diffusion (Poisson + log-normal jumps)."""
    kappa = np.exp(mu_j + 0.5 * sigma_j**2) - 1.0   # mean jump size
    lam_p = lam * (1 + kappa)                         # risk-neutral intensity

    price = 0.0
    for k in range(n_terms):
        w = poisson.pmf(k, lam * T)
        if w < 1e-15:
            continue
        r_k = r - lam * kappa + k * mu_j / T
        sigma_k = np.sqrt(sigma**2 + k * sigma_j**2 / T)
        d1 = (np.log(S / K) + (r_k + 0.5 * sigma_k**2) * T) / (sigma_k * np.sqrt(T))
        d2 = d1 - sigma_k * np.sqrt(T)
        bs_k = S * norm.cdf(d1) - K * np.exp(-r_k * T) * norm.cdf(d2)
        price += w * np.exp(-lam_p * T) * (lam_p * T)**k / np.math.factorial(k) * bs_k
        # Note: weight already via poisson.pmf above but resetting via exact formula
    # Correct: use Poisson weights directly
    price = 0.0
    fac = 1
    for k in range(n_terms):
        if k > 0:
            fac *= k
        w = np.exp(-lam_p * T) * (lam_p * T)**k / fac
        r_k = r - lam * kappa + k * (mu_j / T)
        sigma_k = np.sqrt(sigma**2 + k * sigma_j**2 / T)
        if sigma_k < 1e-10:
            continue
        d1 = (np.log(S / K) + (r_k + 0.5 * sigma_k**2) * T) / (sigma_k * np.sqrt(T))
        d2 = d1 - sigma_k * np.sqrt(T)
        price += w * (S * norm.cdf(d1) - K * np.exp(-r_k * T) * norm.cdf(d2))
    return price
\`\`\``,
    explanation:
      "Prices a European call using Merton's 1976 jump-diffusion model. The formula conditions on k jumps occurring (Poisson weights), adjusting both the drift and volatility for each k, then sums weighted Black-Scholes prices. lam=jump intensity, mu_j/sigma_j=log-normal jump parameters.",
  },
  {
    id: "pyfin-20260716-b1-cds-hazard-bootstrap",
    language: "python",
    tag: "finance",
    title: "CDS Hazard Rate Bootstrapping",
    code: `\`\`\`python
import numpy as np

def bootstrap_hazard(tenors, spreads_bps, recovery=0.4, dt=0.25):
    """Bootstrap piecewise-constant hazard rates from CDS spreads."""
    spreads = np.array(spreads_bps) / 10000
    hazards = []
    survival = [1.0]   # Q(T=0) = 1
    times = [0.0]

    for i, (T, s) in enumerate(zip(tenors, spreads)):
        # Build grid from previous tenor to this one
        prev_T = tenors[i - 1] if i > 0 else 0.0
        h_prev = hazards[-1] if hazards else 0.02   # initial guess
        # Solve: PV(protection leg) = PV(fee leg) for h on [prev_T, T]
        def pv_diff(h):
            pv_prot = 0.0
            pv_fee = 0.0
            t = prev_T
            Q = survival[-1]
            while t < T - 1e-9:
                t_next = min(t + dt, T)
                Q_next = Q * np.exp(-h * (t_next - t))
                df = np.exp(-0.05 * t_next)   # flat 5% risk-free
                pv_prot += (1 - recovery) * (Q - Q_next) * df
                pv_fee += s * Q_next * (t_next - t) * df
                Q = Q_next
                t = t_next
            return pv_prot - pv_fee

        from scipy.optimize import brentq
        h = brentq(pv_diff, 1e-6, 5.0)
        hazards.append(h)
        Q_T = survival[-1] * np.exp(-h * (T - prev_T))
        survival.append(Q_T)
        times.append(T)

    return np.array(tenors), np.array(hazards), np.array(survival[1:])
\`\`\``,
    explanation:
      "Bootstraps piecewise-constant hazard rates from quoted CDS spreads. For each tenor, solves PV(protection leg) = PV(fee leg) numerically using Brent's method. Survival probability decays exponentially within each piecewise segment. Standard ISDA convention uses 40% recovery.",
  },
  {
    id: "pyfin-20260716-b1-cvxpy-mv",
    language: "python",
    tag: "finance",
    title: "Mean-Variance Optimization with cvxpy",
    code: `\`\`\`python
import numpy as np
import cvxpy as cp

def mv_optimize(mu: np.ndarray, Sigma: np.ndarray,
                risk_aversion: float = 1.0,
                w_min: float = 0.0, w_max: float = 0.3):
    """Solve max { mu'w - lambda/2 * w'Sigma w } s.t. 1'w=1, w in [w_min, w_max]."""
    n = len(mu)
    w = cp.Variable(n)
    ret = mu @ w
    risk = cp.quad_form(w, Sigma)
    objective = cp.Maximize(ret - risk_aversion / 2 * risk)
    constraints = [
        cp.sum(w) == 1,
        w >= w_min,
        w <= w_max,
    ]
    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.CLARABEL)

    if prob.status not in ("optimal", "optimal_inaccurate"):
        raise RuntimeError(f"Solver failed: {prob.status}")

    w_opt = w.value
    port_ret = float(mu @ w_opt)
    port_vol = float(np.sqrt(w_opt @ Sigma @ w_opt))
    sharpe = port_ret / port_vol * np.sqrt(252)
    return {"weights": w_opt, "return": port_ret, "vol": port_vol, "sharpe": sharpe}
\`\`\``,
    explanation:
      "Solves the classic Markowitz mean-variance problem as a quadratic program using cvxpy. Box constraints [w_min, w_max] prevent extreme leverage. Risk aversion lambda scales the penalty on portfolio variance. CLARABEL is an open-source cone solver that handles QPs reliably.",
  },
  {
    id: "pyfin-20260716-b1-factor-risk-model",
    language: "python",
    tag: "finance",
    title: "Barra-Style Factor Risk Model",
    code: `\`\`\`python
import numpy as np

def factor_risk_model(returns: np.ndarray, factor_exposures: np.ndarray):
    """
    Decompose portfolio risk into factor and idiosyncratic components.
    returns: (T, N) asset returns
    factor_exposures: (N, K) exposure matrix (e.g. from PCA or style factors)
    """
    T, N = returns.shape
    K = factor_exposures.shape[1]
    B = factor_exposures   # (N, K)

    # OLS: F = (B'B)^{-1} B' R'  -> factor returns (K, T)
    BtB_inv = np.linalg.pinv(B.T @ B)
    F = BtB_inv @ B.T @ returns.T   # (K, T)

    # Residuals
    R_hat = (B @ F).T               # (T, N)
    epsilon = returns - R_hat        # (T, N)

    # Factor covariance (K, K)
    Sigma_F = np.cov(F)             # (K, K)

    # Diagonal idiosyncratic covariance
    D = np.diag(np.var(epsilon, axis=0))   # (N, N)

    # Full covariance
    Sigma = B @ Sigma_F @ B.T + D   # (N, N)

    # For a portfolio w (N,)
    def portfolio_risk(w):
        factor_risk = float(w @ B @ Sigma_F @ B.T @ w)
        idio_risk   = float(w @ D @ w)
        total_risk  = factor_risk + idio_risk
        return {"total": np.sqrt(total_risk),
                "factor_pct": factor_risk / total_risk,
                "idio_pct":   idio_risk   / total_risk}

    return Sigma, F, epsilon, portfolio_risk
\`\`\``,
    explanation:
      "Implements a Barra-style linear factor model. Factor returns are extracted via OLS given exposure matrix B. The full covariance decomposes as B*Sigma_F*B' + D (systematic + diagonal idiosyncratic). The helper function attributes portfolio variance to factor vs. idiosyncratic sources.",
  },
  {
    id: "pyfin-20260716-b1-hmm-regime",
    language: "python",
    tag: "finance",
    title: "HMM Regime Detection (Baum-Welch, 2-state)",
    code: `\`\`\`python
import numpy as np

def hmm_em(obs: np.ndarray, n_states: int = 2, n_iter: int = 100):
    """Fit HMM to return series via Baum-Welch (Gaussian emissions)."""
    T = len(obs)
    # Init parameters
    pi = np.ones(n_states) / n_states
    A  = np.full((n_states, n_states), 1 / n_states)
    mu    = np.quantile(obs, np.linspace(0.2, 0.8, n_states))
    sigma = np.ones(n_states) * obs.std()

    def gauss(x, m, s):
        return np.exp(-0.5 * ((x - m) / s)**2) / (s * np.sqrt(2 * np.pi))

    for _ in range(n_iter):
        # E-step: forward-backward
        B = np.array([[gauss(obs[t], mu[k], sigma[k])
                       for k in range(n_states)] for t in range(T)])  # (T, K)
        # Forward
        alpha = np.zeros((T, n_states))
        alpha[0] = pi * B[0]
        alpha[0] /= alpha[0].sum()
        scales = np.zeros(T)
        scales[0] = alpha[0].sum()
        for t in range(1, T):
            alpha[t] = (alpha[t-1] @ A) * B[t]
            scales[t] = alpha[t].sum() + 1e-300
            alpha[t] /= scales[t]
        # Backward
        beta = np.ones((T, n_states))
        for t in range(T-2, -1, -1):
            beta[t] = (A * B[t+1] * beta[t+1]).sum(axis=1)
            beta[t] /= beta[t].sum() + 1e-300
        # Gamma & xi
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True)
        # M-step
        pi = gamma[0]
        A  = np.einsum("ti,tj->ij",
                       alpha[:-1],
                       (A * B[1:, np.newaxis, :] * beta[1:, np.newaxis, :]).transpose(0,2,1))
        A /= A.sum(axis=1, keepdims=True) + 1e-300
        mu    = (gamma.T @ obs) / (gamma.sum(axis=0) + 1e-300)
        sigma = np.sqrt((gamma.T @ (obs[:, None] - mu)**2).diagonal() /
                        (gamma.sum(axis=0) + 1e-300))
        sigma = np.maximum(sigma, 1e-6)

    regimes = gamma.argmax(axis=1)
    return regimes, mu, sigma, A, pi
\`\`\``,
    explanation:
      "Fits a 2-state Gaussian HMM using Baum-Welch EM. The forward-backward algorithm computes posterior state probabilities (gamma), and M-step re-estimates transition matrix A, emission means mu, and standard deviations sigma. Typical use: identify bull/bear regimes from daily returns.",
  },
  {
    id: "pyfin-20260716-b1-ob-imbalance",
    language: "python",
    tag: "finance",
    title: "Order Book Imbalance Signal",
    code: `\`\`\`python
import numpy as np

def order_imbalance_signal(bids: list, asks: list, depth: int = 5,
                           alpha: float = 0.3) -> float:
    """
    Compute weighted order-book imbalance over top \`depth\` levels.
    bids / asks: list of (price, qty) sorted best-to-worst.
    Returns OBI in [-1, +1]; positive => buy pressure.
    """
    bid_qty = np.array([q for _, q in bids[:depth]], dtype=float)
    ask_qty = np.array([q for _, q in asks[:depth]], dtype=float)
    # Exponential decay weights by level
    weights = np.exp(-alpha * np.arange(depth))
    weights = weights[:len(bid_qty)]   # trim if fewer levels available
    ask_weights = weights[:len(ask_qty)]

    bid_vol = float((bid_qty[:len(weights)] * weights).sum())
    ask_vol = float((ask_qty[:len(ask_weights)] * ask_weights).sum())

    denom = bid_vol + ask_vol
    if denom == 0:
        return 0.0
    return (bid_vol - ask_vol) / denom


def rolling_obi(bid_series, ask_series, window: int = 20):
    """Compute OBI for a sequence of snapshots and smooth with EMA."""
    raw = [order_imbalance_signal(b, a) for b, a in zip(bid_series, ask_series)]
    raw = np.array(raw)
    # EMA smoothing
    ema = np.zeros_like(raw)
    k = 2 / (window + 1)
    ema[0] = raw[0]
    for i in range(1, len(raw)):
        ema[i] = raw[i] * k + ema[i-1] * (1 - k)
    return raw, ema
\`\`\``,
    explanation:
      "Computes order-book imbalance (OBI) as a weighted ratio of bid vs ask volume across top depth levels. Exponential decay weights penalise far levels. OBI near +1 signals buy pressure; -1 signals sell pressure. Often used as a short-horizon predictive signal for adverse selection.",
  },
  {
    id: "pyfin-20260716-b1-opt-rebalance",
    language: "python",
    tag: "finance",
    title: "Optimal Rebalancing with Transaction Costs",
    code: `\`\`\`python
import numpy as np
import cvxpy as cp

def optimal_rebalance(w_current: np.ndarray, w_target: np.ndarray,
                      mu: np.ndarray, Sigma: np.ndarray,
                      tc_bps: float = 10.0, risk_aversion: float = 1.0):
    """
    Find rebalancing trades minimising utility loss + transaction costs.
    Solves: max mu'w - lambda/2 w'Sigma w - tc * ||w - w_current||_1
    """
    n = len(mu)
    tc = tc_bps / 10000
    w = cp.Variable(n)
    trades = w - w_current

    objective = cp.Maximize(
        mu @ w
        - risk_aversion / 2 * cp.quad_form(w, Sigma)
        - tc * cp.norm1(trades)
    )
    constraints = [cp.sum(w) == 1, w >= 0, w <= 0.3]
    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.CLARABEL)

    w_opt = w.value
    turnover = float(np.abs(w_opt - w_current).sum()) / 2
    cost = turnover * tc_bps
    return {"weights": w_opt, "turnover": turnover, "cost_bps": cost,
            "trades": w_opt - w_current}
\`\`\``,
    explanation:
      "Solves the no-trade zone problem: find portfolio weights that balance expected return, risk, and transaction costs. The L1 penalty on trades creates a no-trade band around the target — small deviations don't justify the cost. Higher tc_bps widens the no-trade zone.",
  },
  {
    id: "pyfin-20260716-b1-fx-carry",
    language: "python",
    tag: "finance",
    title: "FX Carry Trade Construction",
    code: `\`\`\`python
import numpy as np
import pandas as pd

def fx_carry_portfolio(spot_rates: pd.DataFrame,
                       forward_rates: pd.DataFrame,
                       n_long: int = 3, n_short: int = 3) -> pd.DataFrame:
    """
    Build a carry portfolio: long high-yielding, short low-yielding currencies.
    spot_rates: (T, N) spot exchange rates (USD per unit of foreign)
    forward_rates: (T, N) 1M forward rates
    Carry = (F/S - 1) approx forward premium = interest rate differential.
    """
    carry = (forward_rates - spot_rates) / spot_rates   # approx rate diff
    signals = pd.DataFrame(index=spot_rates.index, columns=spot_rates.columns, dtype=float)

    for t in spot_rates.index:
        c = carry.loc[t].dropna().sort_values()
        # Short: lowest carry currencies (funding)
        short_ccy = c.index[:n_short]
        # Long: highest carry currencies
        long_ccy  = c.index[-n_long:]
        row = pd.Series(0.0, index=spot_rates.columns)
        row[long_ccy]  =  1.0 / n_long
        row[short_ccy] = -1.0 / n_short
        signals.loc[t] = row

    # Gross returns: spot return + carry
    spot_ret = spot_rates.pct_change()
    daily_carry = (forward_rates / spot_rates - 1) / 21   # monthly -> daily approx
    total_ret = spot_ret + daily_carry

    port_ret = (signals.shift(1) * total_ret).sum(axis=1)
    return port_ret, signals
\`\`\``,
    explanation:
      "Constructs a classic UIP-violation carry trade. Currencies are ranked by forward premium (proxy for interest rate differential). The strategy goes long the top n currencies and short the bottom n, equal-weighted. Returns include both spot appreciation and the carry component.",
  },
  {
    id: "pyfin-20260716-b1-xsec-momentum",
    language: "python",
    tag: "finance",
    title: "Cross-Sectional Momentum Signal",
    code: `\`\`\`python
import numpy as np
import pandas as pd

def cross_sectional_momentum(prices: pd.DataFrame,
                             lookback: int = 252,
                             skip: int = 21,
                             n_long: int = 10,
                             n_short: int = 10) -> pd.Series:
    """
    Classic Jegadeesh-Titman momentum: rank on 12-1M returns.
    Go long top decile, short bottom decile.
    """
    # 12M-1M momentum (skip last month to avoid short-term reversal)
    mom = prices.shift(skip).pct_change(lookback - skip)

    port_returns = []
    for t in range(lookback, len(prices)):
        date = prices.index[t]
        m = mom.iloc[t].dropna().sort_values()
        if len(m) < n_long + n_short:
            port_returns.append((date, np.nan))
            continue
        longs  = m.index[-n_long:]
        shorts = m.index[:n_short]
        daily_ret = prices.iloc[t] / prices.iloc[t - 1] - 1
        ret = (daily_ret[longs].mean() - daily_ret[shorts].mean())
        port_returns.append((date, ret))

    result = pd.DataFrame(port_returns, columns=["date", "return"]).set_index("date")
    return result["return"]
\`\`\``,
    explanation:
      "Implements the Jegadeesh-Titman (1993) momentum strategy. The formation period is 12 months minus the most recent 1 month (to avoid short-term reversal). Assets are ranked cross-sectionally and the portfolio goes long the top n and short the bottom n, rebalanced daily.",
  },
  {
    id: "pyfin-20260716-b1-risk-parity",
    language: "python",
    tag: "finance",
    title: "Risk Parity Portfolio (Equal Risk Contribution)",
    code: `\`\`\`python
import numpy as np
from scipy.optimize import minimize

def risk_parity(Sigma: np.ndarray) -> np.ndarray:
    """Find weights s.t. each asset contributes equally to portfolio variance."""
    n = Sigma.shape[0]

    def risk_contributions(w):
        port_var = w @ Sigma @ w
        marginal  = Sigma @ w
        rc = w * marginal / port_var
        return rc

    def objective(w):
        rc = risk_contributions(w)
        target = 1.0 / n
        return np.sum((rc - target) ** 2)

    w0 = np.ones(n) / n
    constraints = [{"type": "eq", "fun": lambda w: w.sum() - 1}]
    bounds = [(1e-6, 1.0)] * n
    res = minimize(objective, w0, method="SLSQP",
                   bounds=bounds, constraints=constraints,
                   options={"ftol": 1e-12, "maxiter": 1000})
    w_opt = res.x / res.x.sum()
    return w_opt, risk_contributions(w_opt)
\`\`\``,
    explanation:
      "Solves the equal-risk-contribution (ERC) problem by minimising the sum of squared deviations of risk contributions from the 1/N target. Each asset's risk contribution = w_i * (Sigma*w)_i / (w'Sigma*w). Risk parity portfolios are less concentrated than mean-variance optimal ones.",
  },
  {
    id: "pyfin-20260716-b1-backtest-slippage",
    language: "python",
    tag: "finance",
    title: "Vectorised Backtest with Slippage Model",
    code: `\`\`\`python
import numpy as np
import pandas as pd

def backtest(signals: pd.DataFrame, prices: pd.DataFrame,
             tc_bps: float = 5.0, slippage_bps: float = 2.0,
             initial_capital: float = 1e6) -> dict:
    """
    Vectorised backtest with proportional transaction costs + slippage.
    signals: (T, N) target weights; prices: (T, N) close prices.
    """
    tc = (tc_bps + slippage_bps) / 10000

    ret = prices.pct_change().shift(-1)   # forward return

    # Lagged signals (trade at next open, observe signals at close)
    w = signals.shift(1).fillna(0.0)

    # Daily gross return
    gross = (w * ret).sum(axis=1)

    # Turnover = abs change in weights / 2
    turnover = w.diff().abs().sum(axis=1) / 2
    cost     = turnover * tc

    net_ret = gross - cost
    nav = (1 + net_ret).cumprod() * initial_capital

    ann_ret = (1 + net_ret.mean()) ** 252 - 1
    ann_vol = net_ret.std() * np.sqrt(252)
    sharpe  = ann_ret / ann_vol if ann_vol > 0 else 0
    max_dd  = (nav / nav.cummax() - 1).min()

    return {
        "nav": nav,
        "net_returns": net_ret,
        "annual_return": ann_ret,
        "annual_vol": ann_vol,
        "sharpe": sharpe,
        "max_drawdown": max_dd,
        "avg_turnover": float(turnover.mean()),
    }
\`\`\``,
    explanation:
      "Vectorised backtest engine that applies proportional transaction costs and slippage. Signals are lagged by 1 bar to avoid look-ahead. Turnover = half the absolute change in weights. Returns a full NAV series plus annualised Sharpe, vol, and max drawdown.",
  },
  {
    id: "pyfin-20260716-b1-johansen-coint",
    language: "python",
    tag: "finance",
    title: "Johansen Cointegration Test",
    code: `\`\`\`python
import numpy as np
from numpy.linalg import eig

def johansen_trace(Y: np.ndarray, k: int = 1):
    """
    Johansen trace test for cointegration rank.
    Y: (T, N) matrix of I(1) price series.
    k: number of lags in the VAR.
    Returns trace statistics and the cointegrating vectors (cols of V).
    """
    T, N = Y.shape
    dY = np.diff(Y, axis=0)           # (T-1, N)
    Y_lag = Y[:-1]                    # level lags

    # Partial out VAR(k) lags from dY and Y_{t-1}
    def resid(X, Z):
        """OLS residuals of X regressed on Z."""
        B = np.linalg.lstsq(Z, X, rcond=None)[0]
        return X - Z @ B

    if k > 1:
        # Build lag matrix
        lags = np.hstack([dY[j:T-1-k+j] for j in range(k-1)])
        R0 = resid(dY[k-1:], lags)
        R1 = resid(Y_lag[k-1:], lags)
    else:
        R0 = dY
        R1 = Y_lag

    T_ = R0.shape[0]
    S00 = R0.T @ R0 / T_
    S11 = R1.T @ R1 / T_
    S01 = R0.T @ R1 / T_

    # Solve generalised eigenvalue problem
    S11_inv = np.linalg.inv(S11)
    M = S11_inv @ S01.T @ np.linalg.inv(S00) @ S01
    eigenvalues, eigenvectors = eig(M)
    idx = np.argsort(-eigenvalues.real)
    eigenvalues = eigenvalues[idx].real
    V = eigenvectors[:, idx].real   # cointegrating vectors

    # Trace statistics
    trace_stats = -T_ * np.cumsum(np.log(1 - eigenvalues))[::-1][::-1]

    # Critical values (5%, N=2, approximate)
    cv_5pct = {2: [15.41, 3.76], 3: [29.68, 15.41, 3.76]}
    return trace_stats, eigenvalues, V, cv_5pct.get(N, [])
\`\`\``,
    explanation:
      "Implements the Johansen reduced-rank cointegration test. Solves a generalised eigenvalue problem on the moment matrices of the error-correction representation. The trace statistic tests H0: at most r cointegrating relationships. Columns of V are the estimated cointegrating vectors.",
  },
  {
    id: "pyfin-20260716-b1-ois-bootstrap",
    language: "python",
    tag: "finance",
    title: "OIS Discount Curve Bootstrapping",
    code: `\`\`\`python
import numpy as np
from scipy.optimize import brentq

def bootstrap_ois(tenors_yr: list, ois_rates: list) -> dict:
    """
    Bootstrap OIS discount factors from quoted OIS par rates.
    Assumes annual compounding for short end, semi-annual for > 1Y.
    """
    df_curve = {0.0: 1.0}   # DF at t=0

    def interp_df(t):
        ts = sorted(df_curve.keys())
        if t <= ts[0]:
            return df_curve[ts[0]]
        if t >= ts[-1]:
            return df_curve[ts[-1]]
        i = next(i for i, x in enumerate(ts) if x >= t)
        t0, t1 = ts[i-1], ts[i]
        r0 = -np.log(df_curve[t0]) / t0 if t0 > 0 else 0
        r1 = -np.log(df_curve[t1]) / t1
        r  = r0 + (r1 - r0) * (t - t0) / (t1 - t0)
        return np.exp(-r * t)

    for T, r in zip(tenors_yr, ois_rates):
        if T <= 1.0:
            # Simple: DF = 1 / (1 + r * T)
            df_curve[T] = 1.0 / (1 + r * T)
        else:
            # Semi-annual coupon swap; solve for DF(T)
            cpn = r / 2
            prev_T = sorted(df_curve.keys())
            pv_known = sum(cpn * interp_df(t)
                           for t in np.arange(0.5, T, 0.5))
            def eq(df_T):
                return pv_known + (cpn + 1) * df_T - 1.0
            df_T = brentq(eq, 1e-9, 2.0)
            df_curve[T] = df_T

    tenors_out = sorted(df_curve.keys())[1:]
    dfs = [df_curve[t] for t in tenors_out]
    zero_rates = [-np.log(d) / t for d, t in zip(dfs, tenors_out)]
    return {"tenors": tenors_out, "discount_factors": dfs, "zero_rates": zero_rates}
\`\`\``,
    explanation:
      "Bootstraps an OIS (overnight index swap) discount curve from quoted par rates. Short-end tenors use simple interest; longer tenors solve numerically for the discount factor from the par swap pricing equation. The result is a zero-coupon discount factor curve used for CSA-compliant derivatives pricing.",
  },
  {
    id: "pyfin-20260716-b1-dupire-localvol",
    language: "python",
    tag: "finance",
    title: "Dupire Local Volatility from Implied Vol Surface",
    code: `\`\`\`python
import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(K_grid: np.ndarray, T_grid: np.ndarray,
                     C: np.ndarray, S0: float, r: float = 0.0):
    """
    Compute Dupire local vol surface from call price surface C(K, T).
    C: (len(K_grid), len(T_grid)) call prices.
    Returns sigma_loc(K, T) on the same grid.
    """
    spline = RectBivariateSpline(K_grid, T_grid, C, kx=4, ky=4)

    sigma_loc = np.zeros_like(C)
    for i, K in enumerate(K_grid):
        for j, T in enumerate(T_grid):
            dCdT  = float(spline(K, T, dx=0, dy=1))
            dCdK  = float(spline(K, T, dx=1, dy=0))
            d2CdK2 = float(spline(K, T, dx=2, dy=0))

            numerator   = dCdT + r * K * dCdK
            denominator = 0.5 * K**2 * d2CdK2

            if denominator < 1e-10 or numerator < 0:
                sigma_loc[i, j] = np.nan
            else:
                sigma_loc[i, j] = np.sqrt(numerator / denominator)

    return sigma_loc
\`\`\``,
    explanation:
      "Implements the Dupire (1994) formula: sigma_loc^2 = (dC/dT + r K dC/dK) / (0.5 K^2 d^2C/dK^2). A bicubic spline fits the call price surface; analytical derivatives are evaluated at each grid node. Local vol is the unique diffusion coefficient that prices all European options simultaneously.",
  },
  {
    id: "pyfin-20260716-b1-gumbel-copula",
    language: "python",
    tag: "finance",
    title: "Gumbel Copula Simulation (Extreme Value Dependence)",
    code: `\`\`\`python
import numpy as np
from scipy.stats import gumbel_r, norm

def gumbel_copula_sample(n: int, theta: float, d: int = 2) -> np.ndarray:
    """
    Sample from d-dimensional Gumbel copula with parameter theta >= 1.
    theta = 1 => independence; theta -> inf => perfect dependence.
    Uses Marshall-Olkin algorithm.
    """
    # Step 1: Generate stable random variable V ~ S(1/theta, 1, ...)
    # Approximated via Chambers-Mallows-Stuck for alpha = 1/theta
    alpha = 1.0 / theta
    U = np.random.uniform(-np.pi / 2, np.pi / 2, n)
    E = np.random.exponential(1.0, n)
    V = (np.sin(alpha * (U + np.pi / 2)) / np.cos(U) ** (1 / alpha) *
         (np.cos(U - alpha * (U + np.pi / 2)) / E) ** ((1 - alpha) / alpha))

    # Step 2: Generate independent exponentials
    E_mat = np.random.exponential(1.0, (n, d))

    # Step 3: Gumbel copula sample
    U_mat = np.exp(-(E_mat / V[:, None]) ** (1 / theta))

    return U_mat  # uniform marginals on [0,1]^d


def tail_dependence(theta: float) -> float:
    """Upper tail dependence coefficient lambda_U = 2 - 2^{1/theta}."""
    return 2 - 2 ** (1 / theta)
\`\`\``,
    explanation:
      "Simulates from the Gumbel copula using the Marshall-Olkin algorithm. A stable random variable V modulates the dependence; higher theta increases upper-tail dependence (relevant for joint crashes). The Gumbel copula is an extreme-value copula — upper tail dependence is lambda_U = 2 - 2^(1/theta).",
  },
  {
    id: "pyfin-20260716-b1-kupiec-var-backtest",
    language: "python",
    tag: "finance",
    title: "Kupiec POF Test for VaR Backtesting",
    code: `\`\`\`python
import numpy as np
from scipy.stats import chi2

def kupiec_pof(returns: np.ndarray, var_estimates: np.ndarray,
               confidence: float = 0.99) -> dict:
    """
    Kupiec (1995) proportion-of-failures test for VaR model validity.
    H0: probability of exception = 1 - confidence.
    """
    p = 1 - confidence
    exceptions = returns < -var_estimates   # True when loss exceeds VaR
    N = len(returns)
    x = exceptions.sum()
    p_hat = x / N

    if x == 0:
        lr = -2 * (N * np.log(1 - p))
    elif x == N:
        lr = -2 * (N * np.log(p))
    else:
        lr = -2 * (x * np.log(p / p_hat) + (N - x) * np.log((1 - p) / (1 - p_hat)))

    p_value = 1 - chi2.cdf(lr, df=1)
    reject = p_value < 0.05

    return {
        "exceptions": int(x),
        "expected": N * p,
        "exception_rate": p_hat,
        "LR_stat": lr,
        "p_value": p_value,
        "reject_H0": reject,
        "verdict": "FAIL (model underestimates risk)" if reject and p_hat > p
                   else "FAIL (model overestimates risk)" if reject
                   else "PASS",
    }
\`\`\``,
    explanation:
      "Implements the Kupiec proportion-of-failures (POF) likelihood ratio test. Under H0 the number of VaR exceptions follows Binomial(N, 1-c). The LR statistic is chi^2(1). Basel backtesting traffic lights are based on a similar count; Kupiec provides the formal hypothesis test.",
  },
  {
    id: "pyfin-20260716-b1-irs-pricing",
    language: "python",
    tag: "finance",
    title: "Interest Rate Swap (IRS) Pricing",
    code: `\`\`\`python
import numpy as np

def price_irs(fixed_rate: float, notional: float, tenor_yr: float,
              pay_freq: int, discount_factors: dict) -> dict:
    """
    Price a vanilla fixed-for-floating IRS (receiver = long fixed).
    discount_factors: {time: DF} bootstrapped from OIS curve.
    pay_freq: payments per year (2 = semi-annual).
    """
    times = np.arange(1 / pay_freq, tenor_yr + 1e-9, 1 / pay_freq)

    def interp_df(t):
        ts = sorted(discount_factors.keys())
        if not ts:
            return np.exp(-0.03 * t)
        if t <= ts[0]:
            return discount_factors[ts[0]]
        if t >= ts[-1]:
            # flat extrapolation
            return discount_factors[ts[-1]] ** (t / ts[-1])
        i = next(i for i, x in enumerate(ts) if x >= t)
        t0, t1 = ts[i-1], ts[i]
        r0 = -np.log(discount_factors[t0]) / t0 if t0 > 0 else 0
        r1 = -np.log(discount_factors[t1]) / t1
        r  = r0 + (r1 - r0) * (t - t0) / (t1 - t0)
        return np.exp(-r * t)

    dfs = np.array([interp_df(t) for t in times])
    alpha = 1 / pay_freq   # accrual factor

    # Fixed leg PV
    pv_fixed = notional * fixed_rate * alpha * dfs.sum()
    # Floating leg PV = notional * (1 - DF(T)) for libor-OIS flat spread
    pv_float = notional * (1 - interp_df(tenor_yr))

    # For receiver swap: receive fixed, pay float
    pv_swap = pv_fixed - pv_float

    # Par rate (annuity)
    annuity = alpha * dfs.sum()
    par_rate = (1 - interp_df(tenor_yr)) / annuity

    dv01 = notional * alpha * dfs.sum() / 10000   # 1bp sensitivity

    return {"pv": pv_swap, "par_rate": par_rate, "dv01": dv01,
            "pv_fixed": pv_fixed, "pv_float": pv_float}
\`\`\``,
    explanation:
      "Prices a plain-vanilla IRS using a bootstrapped OIS discount curve. Fixed leg = sum of discounted fixed coupons; floating leg collapses to notional * (1 - DF(T)) under no-arbitrage. Par rate is the fixed rate that sets PV = 0. DV01 is the annuity discounted value of 1bp.",
  },
  {
    id: "pyfin-20260716-b1-alpha-combination",
    language: "python",
    tag: "finance",
    title: "Multi-Alpha Signal Combination (IC-weighted)",
    code: `\`\`\`python
import numpy as np

def ic_weighted_alpha(alphas: np.ndarray, ic_history: np.ndarray,
                      window: int = 60, shrinkage: float = 0.3) -> np.ndarray:
    """
    Combine K alphas weighted by their rolling Information Coefficient (IC).
    alphas: (T, K) raw signal matrix (z-scored per column expected)
    ic_history: (T, K) realised IC (correlation of signal with next return)
    Returns combined signal (T,).
    """
    T, K = alphas.shape
    combined = np.zeros(T)
    for t in range(window, T):
        ic_mean = ic_history[t-window:t].mean(axis=0)   # (K,)
        ic_std  = ic_history[t-window:t].std(axis=0) + 1e-9

        # Shrink toward equal-weight
        ic_score = (1 - shrinkage) * ic_mean + shrinkage * ic_mean.mean()

        # Covariance of IC series (account for signal correlation)
        ic_cov   = np.cov(ic_history[t-window:t].T) + 1e-6 * np.eye(K)
        ic_cov_inv = np.linalg.pinv(ic_cov)

        # Optimal weights: w propto Sigma_IC^{-1} * mu_IC
        w = ic_cov_inv @ ic_score
        w = w / (np.abs(w).sum() + 1e-9)

        combined[t] = float(alphas[t] @ w)

    return combined
\`\`\``,
    explanation:
      "Combines multiple alpha signals by weighting them proportionally to their recent Information Coefficients. IC covariance matrix accounts for inter-signal correlation (avoids double-counting correlated signals). Shrinkage pulls weights toward equal-weight when IC estimates are noisy — standard in systematic PM portfolios.",
  },
  {
    id: "pyfin-20260716-b1-black-karasinski",
    language: "python",
    tag: "finance",
    title: "Black-Karasinski Short Rate Simulation",
    code: `\`\`\`python
import numpy as np

def black_karasinski(r0: float, theta_t, kappa: float, sigma: float,
                     T: float, n_steps: int, n_paths: int,
                     seed: int = 42) -> np.ndarray:
    """
    Simulate Black-Karasinski model: d(ln r) = kappa(theta(t)-ln r)dt + sigma dW.
    Lognormal short rate: r > 0 always.
    theta_t: callable or float (time-dependent mean reversion level).
    Returns (n_paths, n_steps+1) short rate paths.
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    sqrt_dt = np.sqrt(dt)

    y = np.zeros((n_paths, n_steps + 1))   # y = ln(r)
    y[:, 0] = np.log(r0)

    for i in range(n_steps):
        t = i * dt
        theta = theta_t(t) if callable(theta_t) else theta_t
        Z = rng.standard_normal(n_paths)
        drift = kappa * (theta - y[:, i])
        y[:, i+1] = y[:, i] + drift * dt + sigma * sqrt_dt * Z

    r = np.exp(y)
    # Bond price P(t, T) via Monte Carlo integration
    discount = np.exp(-r[:, :-1].mean(axis=1) * T)
    return r, discount
\`\`\``,
    explanation:
      "Simulates the Black-Karasinski (1991) model where ln(r) follows an Ornstein-Uhlenbeck process. The lognormal specification guarantees r > 0. theta_t controls the time-varying mean reversion level (calibrated to the initial yield curve). Returns paths and a rough zero-coupon bond price via path-integral approximation.",
  },
  {
    id: "pyfin-20260716-b1-cross-gamma-pnl",
    language: "python",
    tag: "finance",
    title: "Cross-Gamma P&L Attribution (Options Book)",
    code: `\`\`\`python
import numpy as np

def cross_gamma_pnl(deltas: np.ndarray, gammas: np.ndarray,
                    cross_gammas: np.ndarray,
                    dS: np.ndarray) -> dict:
    """
    Second-order P&L attribution for a multi-underlying options book.
    deltas:       (N,) delta vector
    gammas:       (N,) diagonal gamma (dP^2 / dS_i^2)
    cross_gammas: (N, N) off-diagonal gamma matrix
    dS:           (N,) spot moves
    """
    # First-order (delta) P&L
    delta_pnl = float(deltas @ dS)

    # Second-order: 0.5 * sum_i gamma_i * dS_i^2
    diag_gamma_pnl = float(0.5 * (gammas * dS**2).sum())

    # Cross-gamma: 0.5 * sum_{i != j} Gamma_ij * dS_i * dS_j
    cross_matrix = np.outer(dS, dS)
    np.fill_diagonal(cross_matrix, 0.0)   # exclude diagonal
    cross_gamma_pnl = float(0.5 * (cross_gammas * cross_matrix).sum())

    total_pnl = delta_pnl + diag_gamma_pnl + cross_gamma_pnl

    # Attribution as % of total
    total_abs = abs(delta_pnl) + abs(diag_gamma_pnl) + abs(cross_gamma_pnl) + 1e-9
    return {
        "delta_pnl": delta_pnl,
        "gamma_pnl": diag_gamma_pnl,
        "cross_gamma_pnl": cross_gamma_pnl,
        "total_pnl": total_pnl,
        "delta_pct": delta_pnl / total_abs * 100,
        "gamma_pct": diag_gamma_pnl / total_abs * 100,
        "cross_gamma_pct": cross_gamma_pnl / total_abs * 100,
    }
\`\`\``,
    explanation:
      "Attributes P&L to delta, self-gamma, and cross-gamma (off-diagonal second derivatives) for a multi-underlying options book. Cross-gammas capture correlation risk — how joint moves in two underlyings affect the portfolio. Critical for index options and basket products where cross-gamma can dominate.",
  },
];
