import { Snippet } from "./types";

export const pythonFinanceSnippets20260720B1: Snippet[] = [
  {
    id: "pyfin-20260720-b1-garch",
    language: "python",
    title: "GARCH(1,1) Parameter Estimation via MLE",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def garch_loglik(params, returns):
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10
    n = len(returns)
    h = np.full(n, np.var(returns))
    ll = 0.0
    for t in range(1, n):
        h[t] = omega + alpha * returns[t-1]**2 + beta * h[t-1]
        ll += 0.5 * (np.log(2*np.pi) + np.log(h[t]) + returns[t]**2 / h[t])
    return ll

def fit_garch(returns):
    x0 = [1e-6, 0.1, 0.85]
    res = minimize(garch_loglik, x0, args=(returns,),
                   method='Nelder-Mead', options={'xatol':1e-8,'fatol':1e-8})
    omega, alpha, beta = res.x
    print(f"omega=\${omega:.2e}  alpha=\${alpha:.4f}  beta=\${beta:.4f}")
    print(f"persistence=\${alpha+beta:.4f}")
    return res.x

# np.random.seed(42); r = np.random.randn(1000)*0.01; fit_garch(r)`,
    explanation: "GARCH(1,1) models heteroskedastic volatility: h_t = ω + α·r²_{t-1} + β·h_{t-1}. Persistence α+β < 1 ensures stationarity; values close to 1 imply slow mean-reversion, typical of equity returns. MLE via Nelder-Mead avoids computing gradients through the recursion.",
  },
  {
    id: "pyfin-20260720-b1-gaussian-copula",
    language: "python",
    title: "Gaussian Copula for Credit Basket",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_mc(n_obligors, correlation, pd_vec,
                        n_paths=100_000, seed=42):
    """Simulate correlated defaults via Gaussian copula (Li 2000)."""
    rng = np.random.default_rng(seed)
    # Cholesky of equicorrelation matrix: one systematic + idiosyncratic
    rho_sqrt  = np.sqrt(correlation)
    eps_sqrt  = np.sqrt(1 - correlation)

    defaults = np.zeros(n_paths, dtype=int)
    for _ in range(n_paths // 1000):
        Z_sys = rng.standard_normal(1000)          # systematic factor
        Z_idio = rng.standard_normal((1000, n_obligors))
        U = rho_sqrt * Z_sys[:,None] + eps_sqrt * Z_idio
        for j, pd in enumerate(pd_vec):
            threshold = norm.ppf(pd)
            defaults[:1000] += (U[:, j] < threshold).astype(int)
    return defaults

# Example: 5 obligors, 30% correlation, 2% PD each
# d = gaussian_copula_mc(5, 0.30, [0.02]*5)
# print(f"E[defaults]=\${d.mean():.3f}  std=\${d.std():.3f}")`,
    explanation: "The Gaussian copula maps marginal default probabilities to correlated Bernoulli variables through a latent normal factor. One systematic factor Z drives correlation; each obligor defaults if its latent score falls below norm.ppf(PD). This model underlies CDO tranche pricing — and its mis-specification contributed to the 2008 crisis.",
  },
  {
    id: "pyfin-20260720-b1-hist-var",
    language: "python",
    title: "Historical Simulation VaR and ES",
    tag: "finance",
    code: `import numpy as np

def historical_var(returns: np.ndarray, confidence: float = 0.99,
                   horizon: int = 1) -> dict:
    """
    Historical simulation VaR and Expected Shortfall.
    returns: daily P&L or log-returns (not scaled by notional)
    """
    scaled = returns * np.sqrt(horizon)   # square-root-of-time scaling
    sorted_r = np.sort(scaled)
    n = len(sorted_r)
    idx = int((1 - confidence) * n)
    var = -sorted_r[idx]
    es  = -sorted_r[:idx].mean()         # average of tail losses
    return {"VaR": var, "ES": es,
            "observations": n, "tail_obs": idx}

# 1-day, 99% VaR example
rng = np.random.default_rng(0)
daily_pnl = rng.standard_normal(1000) * 1e4  # $10k vol
result = historical_var(daily_pnl, confidence=0.99)
print(f"1-day 99% VaR = \${result['VaR']:,.0f}")
print(f"1-day 99% ES  = \${result['ES']:,.0f}")`,
    explanation: "Historical simulation uses observed return distribution directly — no parametric assumption. ES (Expected Shortfall / CVaR) is the mean loss in the tail beyond VaR, and is sub-additive making it a coherent risk measure. Basel III requires ES at 97.5% confidence for internal models.",
  },
  {
    id: "pyfin-20260720-b1-cds-bootstrap",
    language: "python",
    title: "CDS Spread Bootstrapping (Python)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def cds_bootstrap(tenors, spreads, r=0.02, R=0.40):
    """
    Piecewise-constant hazard rate bootstrap from CDS par spreads.
    tenors:  [1, 2, 3, 5, 7, 10] in years
    spreads: par spreads in decimal (e.g. 0.01 = 100 bps)
    """
    h = []
    prev_T, prev_h = 0.0, 0.0

    for T, s in zip(tenors, spreads):
        def pv_diff(h_i):
            dt   = T - prev_T
            surv = np.exp(-(prev_h * prev_T + h_i * dt))
            df   = np.exp(-r * T)
            pv_prem = s * dt * surv * df
            pv_prot = (1 - R) * (1 - surv) * df
            return pv_prem - pv_prot

        h_i = brentq(pv_diff, 1e-8, 5.0)
        h.append(h_i)
        prev_T = T
        prev_h = h_i

    return h

tenors  = [1, 2, 3, 5]
spreads = [0.0050, 0.0080, 0.0110, 0.0160]
hazards = cds_bootstrap(tenors, spreads)
for T, h in zip(tenors, hazards):
    print(f"T=\${T}Y  h=\${h*1e4:.1f} bps  default_prob=\${1-np.exp(-h*T):.2%}")`,
    explanation: "Brent's method solves each maturity for the hazard rate that makes PV(premium leg) = PV(protection leg). The piecewise-constant assumption means each new CDS maturity adds one free parameter. The resulting survival curve prices CVA, bonds, and basket credit derivatives.",
  },
  {
    id: "pyfin-20260720-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy Interest Rate Tree",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_tree(maturities, zero_rates, vol=0.15, n_steps=None):
    """Calibrate a BDT tree to zero rates and constant vol."""
    n_steps = n_steps or len(maturities)
    dt   = maturities[-1] / n_steps
    tree = np.zeros((n_steps+1, n_steps+1))  # [time, node]

    def disc_factor(t_idx, r0):
        """Price a ZCB using a one-period tree."""
        r_u = r0 * np.exp( vol * np.sqrt(dt))
        r_d = r0 * np.exp(-vol * np.sqrt(dt))
        return 0.5 * (np.exp(-r_u*dt) + np.exp(-r_d*dt))

    tree[0, 0] = zero_rates[0]   # 1-period rate from first zero

    for i in range(1, n_steps):
        target_df = np.exp(-zero_rates[i] * maturities[i])
        def obj(r0):
            # Arrow-Debreu (state price) weighting would be more rigorous
            return disc_factor(i, r0) - target_df
        tree[i, 0] = brentq(obj, 1e-5, 0.5)
        for j in range(i+1):
            tree[i, j] = tree[i, 0] * np.exp(vol * np.sqrt(dt) * (i - 2*j))

    return tree, dt

mats  = [1, 2, 3, 4, 5]
zeros = [0.03, 0.035, 0.038, 0.040, 0.042]
tree, dt = bdt_tree(mats, zeros)
print("Short-rate tree (t=0):", tree[0, 0])`,
    explanation: "The Black-Derman-Toy model populates a binomial short-rate tree calibrated to observed zero rates and an assumed log-normal volatility. Each node's rate satisfies r_{u} = r_{d}·exp(2σ√dt). Used to price callable bonds and American-style rate options.",
  },
  {
    id: "pyfin-20260720-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss Optimal Execution Schedule",
    tag: "finance",
    code: `import numpy as np

def almgren_chriss(X0, T, N, sigma, eta, gamma, lam):
    """
    Almgren-Chriss optimal liquidation schedule.
    X0:    initial position (shares)
    T:     total time horizon (days)
    N:     number of equal time intervals
    sigma: daily volatility of price
    eta:   temporary impact coefficient
    gamma: permanent impact coefficient
    lam:   risk-aversion parameter
    Returns array of shares to trade in each interval.
    """
    tau   = T / N
    kappa = np.sqrt(lam * sigma**2 / eta)
    sinh_kT = np.sinh(kappa * T)
    trades = np.zeros(N)
    for j in range(N):
        t_j   = j * tau
        t_jp1 = (j+1) * tau
        x_j   = X0 * np.sinh(kappa*(T - t_j))   / sinh_kT
        x_jp1 = X0 * np.sinh(kappa*(T - t_jp1)) / sinh_kT
        trades[j] = x_j - x_jp1

    impl_shortfall = (gamma/2 * X0**2
                      + eta * np.sum(trades**2)/tau
                      + lam * sigma**2 * tau * np.sum(np.cumsum(trades[::-1])[::-1]**2))
    print(f"Expected cost: \${impl_shortfall:,.2f}")
    return trades

schedule = almgren_chriss(X0=10000, T=10, N=10,
                           sigma=0.02, eta=0.1, gamma=0.05, lam=1e-6)
print("Shares per interval:", np.round(schedule, 1))`,
    explanation: "Almgren-Chriss solves the mean-variance optimal liquidation problem analytically. High risk-aversion λ pushes toward faster execution (reducing market risk but increasing impact cost); low λ spreads trades to minimise impact. The hyperbolic sine solution is exact for linear temporary impact.",
  },
  {
    id: "pyfin-20260720-b1-ou-calibrate",
    language: "python",
    title: "Ornstein-Uhlenbeck Pairs-Trade Calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def fit_ou(spread: np.ndarray, dt: float = 1/252):
    """
    Calibrate OU process dX = kappa*(mu-X)dt + sigma*dW
    via OLS on the discrete AR(1) equivalent:
    X_t = a + b*X_{t-1} + eps
    """
    X  = spread[:-1]
    Xn = spread[1:]
    # OLS
    A  = np.column_stack([np.ones_like(X), X])
    ab = np.linalg.lstsq(A, Xn, rcond=None)[0]
    a, b = ab
    sigma_eps = np.std(Xn - A @ ab)

    kappa = -np.log(b) / dt
    mu    = a / (1 - b)
    sigma = sigma_eps * np.sqrt(-2*np.log(b) / (dt*(1 - b**2)))
    half_life = np.log(2) / kappa

    print(f"kappa=\${kappa:.2f}  mu=\${mu:.4f}  sigma=\${sigma:.4f}")
    print(f"Half-life=\${half_life*252:.1f} trading days")
    return kappa, mu, sigma

rng = np.random.default_rng(0)
# Simulate an OU spread then calibrate
kappa0, mu0, sigma0, dt = 5.0, 0.0, 0.02, 1/252
X = [0.0]
for _ in range(500):
    X.append(X[-1] + kappa0*(mu0-X[-1])*dt + sigma0*np.sqrt(dt)*rng.standard_normal())
fit_ou(np.array(X))`,
    explanation: "The AR(1) regression X_t = a + b·X_{t-1} + ε is the discrete-time equivalent of the OU SDE. OLS recovers a and b exactly; back-transformation gives κ = -log(b)/dt and σ from residual variance. Half-life tells you how long the spread typically takes to mean-revert — useful for setting holding period.",
  },
  {
    id: "pyfin-20260720-b1-control-variate",
    language: "python",
    title: "Control Variate MC — Geometric Asian",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def geometric_asian_exact(S, K, r, sigma, T, n):
    """Closed-form geometric average Asian call."""
    sigma_g = sigma * np.sqrt((2*n+1)/(6*(n+1)))
    r_g     = 0.5*(r - 0.5*sigma**2 + sigma_g**2)
    d1 = (np.log(S/K) + (r_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g*np.sqrt(T)
    return np.exp(-r*T)*(S*np.exp(r_g*T)*norm.cdf(d1) - K*norm.cdf(d2))

def arithmetic_asian_cv(S, K, r, sigma, T, n, paths, seed=42):
    """Use geometric Asian as control variate for arithmetic Asian."""
    rng = np.random.default_rng(seed)
    dt  = T / n
    Z   = rng.standard_normal((paths, n))
    log_S = np.log(S) + np.cumsum((r-0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=1)
    S_paths = np.exp(log_S)
    arith_avg = S_paths.mean(axis=1)
    geom_avg  = np.exp(log_S.mean(axis=1))
    payoff_A  = np.maximum(arith_avg - K, 0)
    payoff_G  = np.maximum(geom_avg  - K, 0)
    exact_G   = geometric_asian_exact(S, K, r, sigma, T, n)
    # Optimal beta via OLS
    cov  = np.cov(payoff_A, payoff_G)
    beta = cov[0,1] / cov[1,1]
    cv   = payoff_A - beta*(payoff_G - exact_G*np.exp(r*T))
    price = np.exp(-r*T) * cv.mean()
    print(f"Arithmetic Asian (CV): \${price:.4f}  SE=\${cv.std()/np.sqrt(paths):.6f}")
    return price

arithmetic_asian_cv(100, 100, 0.05, 0.2, 1.0, 52, 100_000)`,
    explanation: "The geometric Asian call has a closed-form price; the arithmetic one does not. By treating the geometric payoff as a control variate and regressing the optimal beta, we reduce MC variance by 90%+ for near-ATM options. This is the textbook application of control variates in derivatives pricing.",
  },
  {
    id: "pyfin-20260720-b1-evt-gpd",
    language: "python",
    title: "Extreme Value Theory — GPD Tail Fit",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def evt_var(losses: np.ndarray, u_quantile: float = 0.90,
            confidence: float = 0.99) -> dict:
    """
    Fit Generalized Pareto Distribution to tail exceedances.
    losses: array of positive loss observations
    """
    u = np.quantile(losses, u_quantile)
    exceedances = losses[losses > u] - u
    n, n_u = len(losses), len(exceedances)

    xi, loc, sigma = genpareto.fit(exceedances, floc=0)
    print(f"GPD fit: xi=\${xi:.4f}  sigma=\${sigma:.4f}  (tail obs=\${n_u})")

    # VaR and ES from GPD tail formula
    p = 1 - confidence
    var_gpd = u + sigma/xi * ((n/n_u * (1-confidence))**(-xi) - 1) if xi != 0 \
              else u - sigma*np.log(n/n_u*(1-confidence))
    es_gpd  = (var_gpd + sigma - xi*u) / (1 - xi)

    return {"threshold": u, "xi": xi, "sigma": sigma,
            "VaR_99": var_gpd, "ES_99": es_gpd}

rng = np.random.default_rng(0)
losses = rng.pareto(3, 2000) * 1e4   # heavy-tailed synthetic losses
result = evt_var(losses)
print(f"VaR 99% = \${result['VaR_99']:,.0f}   ES 99% = \${result['ES_99']:,.0f}")`,
    explanation: "EVT separates the body of the return distribution from the tail. Above a threshold u, the GPD is theoretically exact. Shape parameter ξ > 0 means a heavy tail (Pareto-like); ξ ≈ 0 is exponential. EVT VaR is more accurate than Gaussian VaR in crisis regimes, making it popular for operational and market risk capital.",
  },
  {
    id: "pyfin-20260720-b1-complex-step-greeks",
    language: "python",
    title: "Complex-Step Differentiation for Greeks",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_complex(S, K, r, sigma, T):
    """Black-Scholes call accepting complex S for complex-step diff."""
    import cmath
    sqT  = cmath.sqrt(T)
    d1   = (cmath.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqT)
    d2   = d1 - sigma*sqT
    # Use erfc for complex argument via scipy is tricky; use series approx
    # For demo, use real-valued norm.cdf (works when imag part is tiny)
    N = lambda x: norm.cdf(x.real)
    return S*N(d1) - K*np.exp(-r*T)*N(d2)

def complex_step_delta(S, K, r, sigma, T, h=1e-20):
    """Machine-precision delta via complex-step: Im[f(S+ih)]/h."""
    val = bs_call_complex(complex(S, h), K, r, sigma, T)
    return val.imag / h

def complex_step_gamma(S, K, r, sigma, T, h=1e-6):
    """Gamma via second-order finite difference (complex step for first)."""
    d_up = complex_step_delta(S+h, K, r, sigma, T)
    d_dn = complex_step_delta(S-h, K, r, sigma, T)
    return (d_up - d_dn) / (2*h)

S,K,r,v,T = 100,100,0.05,0.2,1.0
print(f"Delta (complex-step)  = \${complex_step_delta(S,K,r,v,T):.8f}")
print(f"Gamma (complex-step)  = \${complex_step_gamma(S,K,r,v,T):.8f}")`,
    explanation: "Complex-step differentiation evaluates f(x+ih)/h to compute df/dx with machine precision — no cancellation error like finite differences. It avoids implementing analytical formulas for each Greek, useful when pricing functions are complex (path-dependent or PDE-based).",
  },
  {
    id: "pyfin-20260720-b1-rf-alpha",
    language: "python",
    title: "Random Forest Alpha Signal",
    tag: "finance",
    code: `import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import roc_auc_score

def build_rf_alpha(prices: np.ndarray, forward_days: int = 5):
    n = len(prices)
    returns = np.diff(np.log(prices))

    # Features: 5-day, 10-day, 20-day momentum + vol
    X, y = [], []
    for i in range(25, n - forward_days - 1):
        r5   = returns[i-5:i].sum()
        r10  = returns[i-10:i].sum()
        r20  = returns[i-20:i].sum()
        vol5 = returns[i-5:i].std()
        X.append([r5, r10, r20, vol5])
        future_ret = returns[i:i+forward_days].sum()
        y.append(1 if future_ret > 0 else 0)

    X, y = np.array(X), np.array(y)
    tscv = TimeSeriesSplit(n_splits=5)
    aucs = []
    for train_idx, test_idx in tscv.split(X):
        clf = RandomForestClassifier(n_estimators=100, max_depth=4,
                                      random_state=42)
        clf.fit(X[train_idx], y[train_idx])
        prob = clf.predict_proba(X[test_idx])[:, 1]
        aucs.append(roc_auc_score(y[test_idx], prob))
    print(f"Cross-val AUC: \${np.mean(aucs):.3f} +/- \${np.std(aucs):.3f}")
    return clf

rng = np.random.default_rng(0)
prices = np.cumprod(1 + rng.normal(0, 0.01, 500))
build_rf_alpha(prices * 100)`,
    explanation: "TimeSeriesSplit prevents look-ahead bias by always training on past and testing on future. AUC > 0.52 on out-of-sample data suggests a weak but tradeable edge. Random forests handle non-linear interactions between momentum windows and volatility states that linear models miss.",
  },
  {
    id: "pyfin-20260720-b1-pca-risk",
    language: "python",
    title: "PCA Risk Factor Decomposition",
    tag: "finance",
    code: `import numpy as np

def pca_risk_model(return_matrix: np.ndarray, n_factors: int = 3):
    """
    return_matrix: (T, N) daily returns for N assets
    Decomposes risk into factor and idiosyncratic components.
    """
    T, N = return_matrix.shape
    mu   = return_matrix.mean(axis=0)
    R    = return_matrix - mu           # demean

    cov = R.T @ R / (T - 1)
    eigvals, eigvecs = np.linalg.eigh(cov)
    # Sort descending
    idx    = np.argsort(eigvals)[::-1]
    eigvals, eigvecs = eigvals[idx], eigvecs[:, idx]

    B  = eigvecs[:, :n_factors]         # (N, K) factor loadings
    F  = R @ B                          # (T, K) factor returns

    explained = eigvals[:n_factors].sum() / eigvals.sum()
    print(f"Explained variance by \${n_factors} factors: \${explained:.1%}")

    # Factor and idiosyncratic covariance
    cov_factor = B @ np.diag(eigvals[:n_factors]) @ B.T
    cov_idio   = np.diag(np.diag(cov - cov_factor))
    cov_model  = cov_factor + cov_idio

    return {"loadings": B, "factor_returns": F,
            "cov_model": cov_model, "explained": explained}

rng = np.random.default_rng(0)
R   = rng.standard_normal((252, 50)) * 0.01
result = pca_risk_model(R)`,
    explanation: "PCA extracts orthogonal risk factors that explain most portfolio variance. The first PC typically represents market beta; subsequent PCs capture sector or style rotations. The factor-plus-idiosyncratic covariance decomposition is the foundation of Barra/FactorSet risk models used in portfolio construction.",
  },
  {
    id: "pyfin-20260720-b1-impl-corr",
    language: "python",
    title: "Implied Correlation from Index and Single-Stock Vols",
    tag: "finance",
    code: `import numpy as np

def implied_correlation(index_vol: float,
                         weights: np.ndarray,
                         stock_vols: np.ndarray) -> float:
    """
    Back out average implied correlation from index vs single-stock vols.
    index_vol:  implied vol of the index (e.g. SPX)
    weights:    index constituent weights (sum to 1)
    stock_vols: implied vols of each constituent
    """
    # Index variance = sum_i sum_j w_i*w_j*rho_ij*sig_i*sig_j
    # Under flat correlation rho: sigma_idx^2 = rho*sum(w*sig)^2 + (1-rho)*sum(w^2*sig^2)
    wvar  = np.sum(weights**2 * stock_vols**2)    # idiosyncratic part
    wcovar = (np.sum(weights * stock_vols))**2     # perfect-correlation part

    rho = (index_vol**2 - wvar) / (wcovar - wvar)
    rho = np.clip(rho, 0.0, 1.0)

    print(f"Implied correlation = \${rho:.4f}")
    return rho

# Example: 3 stocks equal-weighted
weights   = np.array([1/3, 1/3, 1/3])
stock_vols = np.array([0.25, 0.30, 0.22])
idx_vol   = 0.20
implied_correlation(idx_vol, weights, stock_vols)`,
    explanation: "Implied correlation measures the market's expectation of average pairwise correlation. When index vol is low relative to single-stock vols, correlation is low (dispersion opportunity). The metric drives dispersion trades: buy index variance, sell stock variance, profiting when stocks move independently.",
  },
  {
    id: "pyfin-20260720-b1-stressed-var",
    language: "python",
    title: "Stressed VaR (Basel 2.5)",
    tag: "finance",
    code: `import numpy as np

def stressed_var(returns: np.ndarray,
                 all_returns: np.ndarray,
                 window: int = 252,
                 confidence: float = 0.99) -> dict:
    """
    Basel 2.5 Stressed VaR: find the 252-day window with worst 99% VaR
    and apply it to the current portfolio weights.
    returns:     current portfolio daily returns (recent)
    all_returns: full historical returns (multi-year)
    """
    n = len(all_returns)
    worst_var, worst_start = 0.0, 0

    for start in range(n - window):
        window_r = all_returns[start:start + window]
        # Apply current portfolio exposure (scalar for simplicity)
        # In practice: multiply factor returns by current weights
        sorted_r = np.sort(window_r)
        idx  = int((1 - confidence) * window)
        var  = -sorted_r[idx]
        if var > worst_var:
            worst_var, worst_start = var, start

    current_var = -np.sort(returns)[int((1-confidence)*len(returns))]
    print(f"Current VaR        = \${current_var:.4f}")
    print(f"Stressed VaR       = \${worst_var:.4f}  (window start: \${worst_start})")
    print(f"SVaR / VaR ratio   = \${worst_var/current_var:.2f}x")
    return {"current_var": current_var, "stressed_var": worst_var}

rng = np.random.default_rng(0)
hist  = np.concatenate([rng.normal(0, 0.01, 1500),
                         rng.normal(0, 0.04, 252),   # crisis window
                         rng.normal(0, 0.01, 500)])
curr  = rng.normal(0, 0.012, 250)
stressed_var(curr, hist)`,
    explanation: "Basel 2.5 added SVaR to prevent banks from shrinking their capital base during calm periods. The capital charge is max(VaR, SVaR) × multiplier (≥3). Finding the worst 252-day window requires scanning the full history; many firms use 2007–2009 as their stressed period by definition.",
  },
  {
    id: "pyfin-20260720-b1-heston-fft",
    language: "python",
    title: "Heston Model Option Pricing via FFT (Carr-Madan)",
    tag: "finance",
    code: `import numpy as np

def heston_char_fn(u, S, K, r, T, kappa, theta, sigma, rho, v0):
    """Heston characteristic function (log-price)."""
    xi = kappa - 1j*rho*sigma*u
    d  = np.sqrt(xi**2 + sigma**2*(u**2 + 1j*u))
    g  = (xi - d) / (xi + d)
    A  = 1j*u*(np.log(S) + r*T)
    B  = kappa*theta/sigma**2 * ((xi-d)*T - 2*np.log((1-g*np.exp(-d*T))/(1-g)))
    C  = v0/sigma**2*(xi-d)*(1-np.exp(-d*T))/(1-g*np.exp(-d*T))
    return np.exp(A + B + C)

def heston_fft_price(S, K, r, T, kappa, theta, sigma, rho, v0,
                      N=4096, eta=0.25, alpha=1.5):
    lam  = 2*np.pi / (N*eta)
    b    = np.pi / eta
    u    = np.arange(N)*eta
    k    = -b + lam*np.arange(N)
    disc = np.exp(-r*T)
    psi  = disc * heston_char_fn(u - (alpha+1)*1j, S, K, r, T,
                                  kappa, theta, sigma, rho, v0)
    psi /= (alpha**2 + alpha - u**2 + 1j*(2*alpha+1)*u)
    w    = eta*(3 + (-1)**(np.arange(N)+1)) / 3
    w[0] = eta/3
    x    = np.real(np.fft.fft(psi * np.exp(1j*u*b) * w)) * np.exp(-alpha*k)/np.pi
    strikes = np.exp(k)
    # Interpolate for the requested K
    idx = np.searchsorted(strikes, K)
    price = np.interp(np.log(K), k, x)
    return price

p = heston_fft_price(100, 100, 0.05, 1.0, 2.0, 0.04, 0.3, -0.7, 0.04)
print(f"Heston call price (FFT): \${p:.4f}")`,
    explanation: "Carr-Madan transforms the option pricing problem into a Fourier integral over the characteristic function, then evaluates it via FFT in O(N log N). The dampening factor α ensures integrability. This is the standard approach for calibrating Heston to the vol surface because it prices all strikes simultaneously.",
  },
  {
    id: "pyfin-20260720-b1-fx-carry",
    language: "python",
    title: "FX Carry Strategy Backtest",
    tag: "finance",
    code: `import numpy as np

def fx_carry_backtest(spot_returns: np.ndarray,
                       interest_diff: np.ndarray,
                       transaction_cost: float = 0.0002) -> dict:
    """
    Simple FX carry: go long high-yield, short low-yield currencies.
    spot_returns:  (T, N) daily FX spot returns (positive = base appreciates)
    interest_diff: (T, N) daily interest rate differential (annualised/252)
    """
    T, N = spot_returns.shape
    # Position: +1 if positive carry, -1 if negative carry
    signal = np.sign(interest_diff)
    # Total return = spot return + carry - costs
    gross_ret = spot_returns + interest_diff
    costs     = np.abs(np.diff(signal, axis=0, prepend=signal[[0]])) * transaction_cost
    port_ret  = (signal * gross_ret - costs).mean(axis=1)  # equal-weight

    cumret  = np.cumprod(1 + port_ret)
    ann_ret = cumret[-1]**(252/T) - 1
    ann_vol = port_ret.std() * np.sqrt(252)
    sharpe  = ann_ret / ann_vol

    print(f"Ann. Return = \${ann_ret:.2%}   Ann. Vol = \${ann_vol:.2%}   Sharpe = \${sharpe:.2f}")
    return {"sharpe": sharpe, "cum_return": cumret}

rng = np.random.default_rng(42)
T, N = 1260, 8   # 5 years, 8 currency pairs
spot  = rng.normal(0, 0.005, (T, N))
carry = rng.uniform(-0.03/252, 0.05/252, (T, N))
fx_carry_backtest(spot, carry)`,
    explanation: "FX carry exploits the forward premium anomaly: high-yield currencies tend to appreciate rather than depreciate as uncovered interest parity predicts. The strategy earns the rate differential and pockets spot moves. Transaction costs and crash risk (carry unwinds sharply in crises) are the main risks.",
  },
  {
    id: "pyfin-20260720-b1-jensens-alpha",
    language: "python",
    title: "Jensen's Alpha and Attribution",
    tag: "finance",
    code: `import numpy as np
from scipy import stats

def jensens_alpha(port_returns: np.ndarray,
                   bench_returns: np.ndarray,
                   rf: float = 0.0) -> dict:
    """
    Jensen's alpha: alpha = E[R_p] - [rf + beta*(E[R_b]-rf)]
    Also computes Treynor ratio and information ratio.
    """
    rp = port_returns - rf
    rb = bench_returns - rf

    beta, alpha_ann, r, p, se = stats.linregress(rb, rp)
    alpha_daily = alpha_ann  # regress returns directly (already daily)
    alpha_annual = alpha_daily * 252

    tracking_err = (port_returns - bench_returns).std() * np.sqrt(252)
    info_ratio   = (port_returns - bench_returns).mean()*252 / tracking_err
    treynor      = rp.mean()*252 / beta

    print(f"Beta       = \${beta:.3f}")
    print(f"Alpha (pa) = \${alpha_annual:.2%}  p-value=\${p:.3f}")
    print(f"Info Ratio = \${info_ratio:.2f}")
    print(f"Treynor    = \${treynor:.4f}")
    return {"alpha": alpha_annual, "beta": beta, "info_ratio": info_ratio}

rng = np.random.default_rng(0)
bench = rng.normal(0.0004, 0.01, 252)
port  = 1.05*bench + rng.normal(0.0001, 0.003, 252)  # beta>1, positive alpha
jensens_alpha(port, bench)`,
    explanation: "Jensen's alpha measures risk-adjusted excess return above the CAPM prediction. A statistically significant (p < 0.05) positive alpha suggests genuine skill rather than luck or hidden factor exposure. The information ratio standardises active return by tracking error, enabling comparison across managers.",
  },
  {
    id: "pyfin-20260720-b1-sabr-calibrate",
    language: "python",
    title: "SABR Calibration to Swaption Vol Surface",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_atm_vol(F, T, alpha, beta, rho, nu):
    FK_b = F**(1-beta)
    return alpha/FK_b * (1 + ((1-beta)**2/24*alpha**2/FK_b**2
                              + 0.25*rho*beta*nu*alpha/FK_b
                              + (2-3*rho**2)/24*nu**2)*T)

def calibrate_sabr(F, T, market_vols, strikes, beta=0.5):
    """Calibrate alpha, rho, nu to market implied vols at given strikes."""
    def obj(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
            return 1e10
        err = 0
        for K, mv in zip(strikes, market_vols):
            FK  = (F*K)**((1-beta)/2)
            lnFK= np.log(F/K)
            z   = nu/alpha*FK*lnFK
            if abs(z) < 1e-10:
                sv = sabr_atm_vol(F, T, alpha, beta, rho, nu)
            else:
                x_z = np.log((np.sqrt(1-2*rho*z+z**2)+z-rho)/(1-rho))
                A = alpha/(FK*(1+(1-beta)**2/24*lnFK**2))
                B = z/x_z
                C = 1+((1-beta)**2/24*alpha**2/FK**2
                       +0.25*rho*beta*nu*alpha/FK
                       +(2-3*rho**2)/24*nu**2)*T
                sv = A*B*C
            err += (sv - mv)**2
        return err

    res = minimize(obj, [0.3, -0.3, 0.4], method='Nelder-Mead')
    alpha, rho, nu = res.x
    print(f"alpha=\${alpha:.4f}  rho=\${rho:.4f}  nu=\${nu:.4f}")
    return res.x

strikes = np.array([0.01, 0.02, 0.03, 0.04, 0.05])
mkt_vols = np.array([0.35, 0.30, 0.28, 0.29, 0.31])
calibrate_sabr(F=0.03, T=5.0, market_vols=mkt_vols, strikes=strikes)`,
    explanation: "SABR calibration fits three parameters (α, ρ, ν) to observed swaption implied vols at multiple strikes for a fixed expiry. A negative ρ (typical in rates) creates a negative skew. Calibrated SABR serves as the vol interpolator for risk management and pricing of exotic rate products.",
  },
  {
    id: "pyfin-20260720-b1-cva-mc",
    language: "python",
    title: "Unilateral CVA Monte Carlo (IR Swap)",
    tag: "finance",
    code: `import numpy as np

def swap_pv(fixed_rate, libor, notional, T, freq=4):
    """Simple swap PV: float - fixed."""
    n  = int(T * freq)
    dt = 1.0 / freq
    disc = np.exp(-libor * np.arange(1, n+1) * dt)
    float_pv = notional
    fixed_pv = notional * fixed_rate * dt * disc.sum() + notional * disc[-1]
    return float_pv - fixed_pv

def cva_mc(fixed_rate, notional, T, r0, kappa, theta, sigma,
           pd_hazard, recovery=0.40, paths=20_000, steps=40, seed=42):
    """Simulate Hull-White short rates; compute CVA as E[LGD * EE * dPD]."""
    rng  = np.random.default_rng(seed)
    dt   = T / steps
    cva  = 0.0
    lgd  = 1 - recovery

    for _ in range(paths):
        r = r0
        for s in range(steps):
            r += kappa*(theta - r)*dt + sigma*np.sqrt(dt)*rng.standard_normal()
            r  = max(r, 0)
            libor = r
            mtm = swap_pv(fixed_rate, libor, notional, T - s*dt)
            ee  = max(mtm, 0)               # exposure = positive MtM
            dp  = pd_hazard * dt            # default prob in interval
            cva += lgd * ee * dp * np.exp(-r*s*dt)

    cva /= paths
    print(f"CVA = \${cva:,.2f}  ({cva/notional*1e4:.2f} bps on notional)")
    return cva

cva_mc(fixed_rate=0.03, notional=1e6, T=5, r0=0.03,
       kappa=0.5, theta=0.03, sigma=0.01, pd_hazard=0.02)`,
    explanation: "CVA is the risk-neutral expected loss from counterparty default: integral of LGD × EE(t) × dPD(t) × DF(t). This MC simulation evolves the short rate via Hull-White, computes the Expected Exposure (positive MtM) at each step, and accumulates the discounted loss. Bilateral CVA subtracts DVA for own default risk.",
  },
  {
    id: "pyfin-20260720-b1-ois-curve",
    language: "python",
    title: "OIS Curve Bootstrapping",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def ois_bootstrap(maturities: list, ois_rates: list) -> tuple:
    """
    Bootstrap OIS discount factors from overnight indexed swap rates.
    OIS rate: annualised fixed rate that equates to compounded O/N fixings.
    """
    dfs, times = [1.0], [0.0]

    for T, s in zip(maturities, ois_rates):
        def pv_diff(df_T):
            # PV fixed leg = s * sum_i df_i * dt_i (approx annual)
            dt   = T - times[-1]
            pv_f = s * dt * df_T           # simplified: one period
            pv_fl= dfs[-1] - df_T          # float = par - final df
            return pv_f - pv_fl

        df_T = brentq(pv_diff, 1e-6, 1.5)
        dfs.append(df_T)
        times.append(T)

    dfs   = np.array(dfs)
    times = np.array(times)
    zero_rates = -np.log(dfs[1:]) / times[1:]

    for T, r, df in zip(times[1:], zero_rates, dfs[1:]):
        print(f"T=\${T:.1f}Y  OIS zero=\${r:.4f}  DF=\${df:.6f}")

    return times, dfs, zero_rates

mats     = [1, 2, 3, 5, 7, 10]
ois_swaps = [0.0250, 0.0270, 0.0290, 0.0320, 0.0340, 0.0360]
ois_bootstrap(mats, ois_swaps)`,
    explanation: "Post-2008, OIS (overnight-indexed swap) replaced LIBOR as the risk-free discounting curve because OIS rates reflect the actual cost of collateralised funding. Bootstrapping OIS gives discount factors for CSA-collateralised derivatives. The float leg of an OIS equals the compounded overnight rate, making it nearly credit-risk-free.",
  },
  {
    id: "pyfin-20260720-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep OTM Options",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def is_deep_otm_call(S, K, r, sigma, T, paths=100_000, seed=42):
    """
    Importance sampling for deep OTM call: shift the drift so that
    the mean of S_T lands at K, boosting rare-event probability.
    """
    rng = np.random.default_rng(seed)
    lnK  = np.log(K/S) - (r - 0.5*sigma**2)*T
    mu_star = lnK / (sigma*np.sqrt(T))         # optimal shift in std devs

    Z    = rng.standard_normal(paths)
    Z_is = Z + mu_star                          # shifted samples
    S_T  = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z_is)
    payoff = np.maximum(S_T - K, 0)

    # Likelihood ratio (Radon-Nikodym derivative)
    lr = np.exp(-mu_star*Z - 0.5*mu_star**2)
    price = np.exp(-r*T) * np.mean(payoff * lr)
    stderr = np.exp(-r*T) * (payoff*lr).std() / np.sqrt(paths)

    # Analytical reference
    d1 = (np.log(S/K)+(r+0.5*sigma**2)*T)/(sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    bs = S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

    print(f"IS price  = \${price:.6f} +/- \${stderr:.6f}")
    print(f"BS exact  = \${bs:.6f}")
    return price

is_deep_otm_call(100, 150, 0.05, 0.2, 1.0)`,
    explanation: "Crude MC for deep OTM options is inefficient: 99.9%+ of paths give zero payoff. Importance sampling shifts the sampling distribution toward the payoff region and corrects with the likelihood ratio. This can reduce standard error by 100x for options 3+ standard deviations OTM, critical for tail risk estimation.",
  },
  {
    id: "pyfin-20260720-b1-basket-corr",
    language: "python",
    title: "Correlated Basket Option MC",
    tag: "finance",
    code: `import numpy as np

def basket_call_mc(S0s, weights, K, r, sigmas, corr, T,
                    paths=100_000, seed=42):
    """
    MC pricing of a basket call option with correlated underlyings.
    S0s:     initial prices (N,)
    weights: basket weights (N,), sum to 1
    sigmas:  volatilities (N,)
    corr:    correlation matrix (N, N)
    """
    rng = np.random.default_rng(seed)
    N   = len(S0s)
    L   = np.linalg.cholesky(corr)    # Cholesky decomposition

    Z    = rng.standard_normal((paths, N))
    Z_c  = Z @ L.T                     # correlated normals

    drifts = (r - 0.5*sigmas**2)*T
    vols   = sigmas * np.sqrt(T)
    log_ST = np.log(S0s) + drifts + vols * Z_c
    S_T    = np.exp(log_ST)            # (paths, N)

    basket_T = (S_T * weights).sum(axis=1)
    payoff   = np.maximum(basket_T - K, 0)
    price    = np.exp(-r*T) * payoff.mean()
    stderr   = np.exp(-r*T) * payoff.std() / np.sqrt(paths)

    print(f"Basket call price = \${price:.4f} +/- \${stderr:.4f}")
    return price

S0s     = np.array([100.0, 120.0, 80.0])
weights = np.array([0.4, 0.4, 0.2])
sigmas  = np.array([0.2, 0.25, 0.3])
corr    = np.array([[1.0, 0.6, 0.4],
                    [0.6, 1.0, 0.5],
                    [0.4, 0.5, 1.0]])
basket_call_mc(S0s, weights, 105, 0.05, sigmas, corr, 1.0)`,
    explanation: "Cholesky decomposition of the correlation matrix maps independent normals to correlated normals, preserving each marginal distribution. Basket options cannot be priced analytically (sum-of-lognormals has no closed form), so MC or moment-matching approximations are standard. The price is sensitive to correlation — long correlation for OTM baskets.",
  },
];
