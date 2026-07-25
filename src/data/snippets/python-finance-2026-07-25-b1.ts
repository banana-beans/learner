import type { Snippet } from "./types";

export const pythonFinanceSnippets20260725B1: Snippet[] = [
  {
    id: "pyfin-20260725-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel yield curve fitting",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(tenors, b0, b1, b2, lam):
    """
    Nelson-Siegel (1987) three-factor yield curve:
      y(t) = b0 + b1*(1-e^{-t/λ})/(t/λ) + b2*[(1-e^{-t/λ})/(t/λ) - e^{-t/λ}]

    b0 = long-run level  (infinite maturity rate)
    b1 = slope factor    (short-rate relative to long-rate; negative for normal curve)
    b2 = curvature/hump  (medium-term effect, bell-shaped loading)
    lam = decay parameter (controls where hump peaks: t* = λ)
    """
    t = np.asarray(tenors, dtype=float)
    x = t / lam
    loading1 = (1 - np.exp(-x)) / x          # slope loading (→1 as t→0, →0 as t→∞)
    loading2 = loading1 - np.exp(-x)          # curvature loading (hump shape)
    return b0 + b1 * loading1 + b2 * loading2

def fit_ns(tenors, yields):
    """Fit NS to observed par/zero yields by minimising SSE."""
    def sse(params):
        b0, b1, b2, lam = params
        if lam <= 0: return 1e10
        fitted = nelson_siegel(tenors, b0, b1, b2, lam)
        return np.sum((fitted - yields)**2)

    result = minimize(sse, x0=[0.05, -0.02, 0.01, 2.0],
                      method="Nelder-Mead",
                      options={"xatol": 1e-8, "fatol": 1e-10, "maxiter": 5000})
    b0, b1, b2, lam = result.x
    print(f"b0={b0:.4f}  b1={b1:.4f}  b2={b2:.4f}  lambda={lam:.4f}")
    return result.x

tenors = np.array([0.25, 0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0])
yields = np.array([0.052, 0.053, 0.051, 0.048, 0.047, 0.046, 0.047, 0.048, 0.050, 0.051])
params = fit_ns(tenors, yields)
fitted_curve = nelson_siegel(tenors, *params)
print(f"Max fitting error: {np.abs(fitted_curve - yields).max()*100:.2f} bp")`,
    explanation: "The Nelson-Siegel model parameterises the entire yield curve with four interpretable factors: the long-run level, slope (term premium), and curvature (hump at an intermediate maturity determined by λ); it is the reference model for central bank yield curve estimation and is analytic (no bootstrapping needed).",
  },
  {
    id: "pyfin-20260725-b1-svensson",
    language: "python",
    title: "Svensson extension of Nelson-Siegel",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson(tenors, b0, b1, b2, b3, lam1, lam2):
    """
    Svensson (1994) adds a second curvature term with its own decay λ2,
    allowing the model to fit both a hump and a trough in the forward curve.

    y(t) = NS(b0,b1,b2,lam1) + b3 * [(1-e^{-t/λ2})/(t/λ2) - e^{-t/λ2}]
    """
    t = np.asarray(tenors, dtype=float)

    def ns_factor(x):
        """Returns (loading1, loading2) for decay parameter x = t/lambda."""
        l1 = (1 - np.exp(-x)) / x
        l2 = l1 - np.exp(-x)
        return l1, l2

    x1 = t / lam1
    x2 = t / lam2
    l1_1, l2_1 = ns_factor(x1)
    l1_2, l2_2 = ns_factor(x2)
    return b0 + b1 * l1_1 + b2 * l2_1 + b3 * l2_2

def fit_sv(tenors, yields):
    def sse(p):
        b0, b1, b2, b3, lam1, lam2 = p
        if lam1 <= 0 or lam2 <= 0 or lam1 == lam2: return 1e10
        return np.sum((svensson(tenors, b0, b1, b2, b3, lam1, lam2) - yields)**2)

    result = minimize(sse, x0=[0.05, -0.02, 0.01, 0.005, 2.0, 5.0],
                      method="Nelder-Mead",
                      options={"maxiter": 10000, "fatol": 1e-12})
    print(f"Params: {result.x.round(5)}")
    return result.x

tenors = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([0.052, 0.053, 0.051, 0.048, 0.047, 0.046, 0.047, 0.048, 0.050, 0.051])
params = fit_sv(tenors, yields)`,
    explanation: "The Svensson model adds a second curvature term (b3, λ2) to Nelson-Siegel, giving the flexibility to fit curves with both a hump in the short end and a different curvature at the long end; it is the Bundesbank's and many central banks' official curve-fitting model.",
  },
  {
    id: "pyfin-20260725-b1-black76",
    language: "python",
    title: "Black-76 model for caps, floors, and swaptions",
    tag: "rates",
    code: `import numpy as np
from scipy.stats import norm

def black76(F, K, r, sigma, T, option_type="call"):
    """
    Black-76: option on futures/forward price F.
    Used for: interest-rate caps/floors (caplet/floorlet), FX options on forwards,
              bond options, and as the market-quote convention for swaptions.

    C = e^{-rT} [F·N(d1) - K·N(d2)]
    P = e^{-rT} [K·N(-d2) - F·N(-d1)]
    """
    d1 = (np.log(F / K) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    df = np.exp(-r * T)

    if option_type == "call":
        return df * (F * norm.cdf(d1) - K * norm.cdf(d2))
    else:
        return df * (K * norm.cdf(-d2) - F * norm.cdf(-d1))

def cap_price(fwd_rates, strikes, vols, dcfs, df_factors):
    """
    Price a cap as a sum of caplets.
    fwd_rates: list of forward SOFR rates for each period
    dcfs: day-count fractions
    df_factors: discount factors P(0, T_i)
    """
    total = 0.0
    for F, K, sigma, dcf, df in zip(fwd_rates, strikes, vols, dcfs, df_factors):
        # Caplet: call on the forward rate with notional 1, day-count dcf
        T = dcf   # approximate time-to-expiry with day-count fraction
        caplet = black76(F, K, r=0.0, sigma=sigma, T=T, option_type="call")
        total += caplet * dcf * df    # notional=1 for simplicity
    return total

# Single caplet: 3M forward rate = 5.2%, strike = 5%, vol = 30%, T = 0.25Y
print(f"Caplet: {black76(0.052, 0.05, 0.05, 0.30, 0.25):.6f}")

# Full cap: 4 quarterly caplets on 5% SOFR cap
fwd = [0.050, 0.051, 0.052, 0.053]
caps = cap_price(fwd, [0.05]*4, [0.30]*4, [0.25]*4, [0.988, 0.976, 0.963, 0.951])
print(f"Cap price (notional=1): {caps:.6f}")`,
    explanation: "Black-76 is the market-standard model for interest-rate options: cap vols are quoted as flat Black-76 implied vol inputs, and the model prices each caplet as an option on the forward rate; switching from LIBOR to SOFR changes only the forward rates—the Black-76 formula is identical.",
  },
  {
    id: "pyfin-20260725-b1-dupire-lv",
    language: "python",
    title: "Dupire local volatility from call price grid",
    tag: "derivatives",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol_surface(Ks, Ts, C, r=0.05):
    """
    Compute the Dupire local vol surface from a grid of European call prices.
    C[i, j] = call price at strike K[i], expiry T[j].

    Dupire (1994): sigma_loc^2(K,T) = (dC/dT + r*K*dC/dK) / (0.5*K^2 * d^2C/dK^2)

    Uses a spline surface to get smooth analytic derivatives.
    """
    # Fit a bicubic spline over the (K, T) grid
    spl = RectBivariateSpline(Ks, Ts, C, kx=3, ky=3)

    K_grid, T_grid = np.meshgrid(Ks, Ts, indexing="ij")
    dC_dT  = spl(Ks, Ts, dy=1)          # first deriv in T direction
    dC_dK  = spl(Ks, Ts, dx=1)          # first deriv in K direction
    d2C_dK = spl(Ks, Ts, dx=2)          # second deriv in K direction

    numerator   = dC_dT + r * K_grid * dC_dK
    denominator = 0.5 * K_grid**2 * d2C_dK

    # Mask arbitrage violations (negative denominator = butterfly arb)
    mask = denominator > 1e-10
    lv   = np.where(mask, np.sqrt(np.maximum(numerator / denominator, 0)), np.nan)
    return lv

# Toy: generate BS call prices on a K×T grid then recover flat vol
from scipy.stats import norm
def bs_call(S, K, r, sig, T):
    d1 = (np.log(S/K) + (r + 0.5*sig**2)*T) / (sig*np.sqrt(T))
    return S * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d1 - sig*np.sqrt(T))

Ks = np.linspace(85, 115, 15)
Ts = np.linspace(0.25, 2.0, 8)
C  = np.array([[bs_call(100, K, 0.05, 0.20, T) for T in Ts] for K in Ks])
lv = dupire_local_vol_surface(Ks, Ts, C)
print(f"Local vol (ATM, T=1): {lv[7, 4]:.4f}")  # should ≈ 0.20`,
    explanation: "Dupire's theorem guarantees that any arbitrage-free call price surface is generated by exactly one local volatility function; when the inputs are smooth (spline-interpolated), the formula recovers the local vol by differentiating numerically—useful for model-free delta hedging and for calibrating local vol Monte Carlo.",
  },
  {
    id: "pyfin-20260725-b1-control-variate",
    language: "python",
    title: "Control variate MC: arithmetic Asian via geometric",
    tag: "simulation",
    code: `import numpy as np
from scipy.stats import norm

def geom_asian_call_cf(S, K, r, sigma, T, n):
    """Closed-form price for geometric average call option."""
    sigma_g = sigma * np.sqrt((2*n + 1) / (6*(n + 1)))
    r_g     = 0.5 * (r - 0.5*sigma**2) + 0.5*sigma_g**2
    d1 = (np.log(S/K) + (r_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g * np.sqrt(T)
    return np.exp(-r*T) * (S * np.exp(r_g*T) * norm.cdf(d1) - K * norm.cdf(d2))

def arith_asian_cv(S, K, r, sigma, T, n=12, paths=50_000):
    """
    Arithmetic Asian call MC with geometric as control variate.
    Estimate beta = Cov(A, G) / Var(G) from the same MC run,
    then apply: E[A] ≈ mean(A) - beta * (mean(G) - E_exact[G]).
    """
    dt   = T / n
    sqdt = np.sqrt(dt)
    np.random.seed(0)
    Z = np.random.standard_normal((paths, n))

    St      = np.zeros((paths, n + 1)); St[:, 0] = S
    for i in range(n):
        St[:, i+1] = St[:, i] * np.exp((r - 0.5*sigma**2)*dt + sigma*sqdt*Z[:, i])

    avg_arith = St[:, 1:].mean(axis=1)    # arithmetic average of n prices
    avg_geom  = np.exp(np.log(St[:, 1:]).mean(axis=1))  # geometric average

    A = np.maximum(avg_arith - K, 0)
    G = np.maximum(avg_geom  - K, 0)
    exact_G = geom_asian_call_cf(S, K, r, sigma, T, n)

    beta = np.cov(A, G)[0, 1] / np.var(G)   # OLS coefficient
    A_cv = A - beta * (G - np.exp(r*T) * exact_G / np.exp(-r*T) * np.exp(-r*T))

    # Standard MC vs control-variate estimate
    mc_price  = np.exp(-r*T) * A.mean()
    cv_price  = np.exp(-r*T) * A_cv.mean()
    mc_se     = np.exp(-r*T) * A.std()   / np.sqrt(paths)
    cv_se     = np.exp(-r*T) * A_cv.std() / np.sqrt(paths)
    print(f"MC:  {mc_price:.4f} SE={mc_se:.6f}")
    print(f"CV:  {cv_price:.4f} SE={cv_se:.6f}  (variance reduction: {(mc_se/cv_se)**2:.1f}x)")
    return cv_price

arith_asian_cv(100, 100, 0.05, 0.20, 1.0)`,
    explanation: "The control variate method exploits the high correlation between arithmetic and geometric Asian payoffs: the beta-adjusted estimator subtracts the MC error from the geometric estimate (which is known analytically), reducing variance by 50–200× compared to naive Monte Carlo.",
  },
  {
    id: "pyfin-20260725-b1-importance-sampling",
    language: "python",
    title: "Importance sampling for deep OTM call options",
    tag: "simulation",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K)+(r+0.5*sigma**2)*T)/(sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def mc_call_importance(S, K, r, sigma, T, paths=100_000):
    """
    Importance sampling for a deep OTM call.
    Under the physical measure most paths never breach K,
    so naive MC wastes 99%+ of simulations.

    Shift the sampling mean to the log-strike so most draws ARE in-the-money.
    The likelihood ratio (Radon-Nikodym derivative) corrects the expectation.
    """
    np.random.seed(1)
    lnS   = np.log(S) + (r - 0.5*sigma**2)*T
    lnK   = np.log(K)
    mu_is = lnK - lnS    # shift: draw N(mu_is, 1) so mean maps to strike

    Z       = np.random.standard_normal(paths) + mu_is   # shifted normals
    ST      = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    payoff  = np.maximum(ST - K, 0)

    # Likelihood ratio: dP/dQ = exp(-mu_is * Z + 0.5*mu_is^2)
    lr      = np.exp(-mu_is * Z + 0.5 * mu_is**2)
    weighted_payoff = payoff * lr

    price_is  = np.exp(-r*T) * weighted_payoff.mean()
    price_mc  = np.exp(-r*T) * np.maximum(
                    S*np.exp((r-0.5*sigma**2)*T + sigma*np.sqrt(T)*
                             np.random.standard_normal(paths)) - K, 0).mean()

    bs = bs_call(S, K, r, sigma, T)
    print(f"Black-Scholes:        {bs:.6f}")
    print(f"Naive MC:             {price_mc:.6f}  SE={(price_mc-bs):.6f}")
    print(f"Importance sampling:  {price_is:.6f}  SE={(price_is-bs):.6f}")
    return price_is

# Deep OTM: S=100, K=140, 10% vol
mc_call_importance(100, 140, 0.05, 0.10, 1.0)`,
    explanation: "For deep out-of-the-money options, the probability of expiring in-the-money is tiny and standard Monte Carlo is extremely inefficient; importance sampling shifts the sampling distribution toward the exercise boundary and reweights via the likelihood ratio, reducing variance by orders of magnitude for the same number of paths.",
  },
  {
    id: "pyfin-20260725-b1-kelly",
    language: "python",
    title: "Kelly criterion: full and fractional sizing",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_discrete(p_win, b_win, b_loss=1.0):
    """
    Discrete Kelly criterion for a binary bet:
      f* = p/b_loss - q/b_win   (p = prob win, q = 1-p)
      b_win = multiple on win, b_loss = fraction lost on loss

    f* maximises log(wealth) in the long run (geometric growth rate).
    """
    q   = 1 - p_win
    f   = p_win / b_loss - q / b_win
    g   = p_win * np.log(1 + b_win * f) + q * np.log(1 - b_loss * f)
    print(f"Kelly f*: {f:.4f}  ({f*100:.1f}% of bankroll)")
    print(f"Expected log-growth per bet: {g:.6f}")
    return f

def kelly_continuous(mu, sigma, rf=0.0):
    """
    Continuous Kelly for a log-normal asset:
      f* = (mu - rf) / sigma^2   = Sharpe / vol
    This is the fraction of wealth to hold in the risky asset.
    """
    f = (mu - rf) / (sigma**2)
    g = rf + (mu - rf)**2 / (2 * sigma**2)   # optimal log-growth rate
    print(f"Continuous Kelly f*: {f:.4f}  max g: {g:.6f}")
    return f

def fractional_kelly(p_win, b_win, fraction=0.5):
    """Half-Kelly or quarter-Kelly reduces drawdown at cost of lower growth."""
    f_full = kelly_discrete(p_win, b_win)
    f_frac = fraction * f_full
    print(f"Half-Kelly: {f_frac:.4f}  ({f_frac*100:.1f}% of bankroll)")
    return f_frac

# Coin flip game: 55% win, payout 1:1
print("--- Discrete Kelly ---")
kelly_discrete(0.55, 1.0)

# Equity-like asset: 8% return, 20% vol, 3% rf
print("--- Continuous Kelly ---")
kelly_continuous(0.08, 0.20, 0.03)`,
    explanation: "Kelly's criterion maximises the long-run geometric growth rate of wealth, which is equivalent to maximising log(wealth); in practice, traders use a fraction (half-Kelly) because the criterion is highly sensitive to parameter estimation errors and full Kelly can produce catastrophic drawdowns under model mis-specification.",
  },
  {
    id: "pyfin-20260725-b1-risk-parity",
    language: "python",
    title: "Risk parity (equal risk contribution) portfolio",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_contribution(w, Sigma):
    """
    Risk contribution of each asset: RC_i = w_i * (Sigma w)_i / sigma_p
    In equal risk contribution (ERC): RC_1 = RC_2 = ... = sigma_p / N
    """
    port_var   = w @ Sigma @ w
    port_vol   = np.sqrt(port_var)
    marginal   = Sigma @ w                   # marginal risk = dσ/dw_i
    rc         = w * marginal / port_vol     # risk contribution (sum = sigma_p)
    return rc

def risk_parity_weights(Sigma, n_iter=1000):
    """
    Solve for weights where each asset contributes equal risk.
    Minimises sum of squared differences in risk contributions.
    """
    n    = Sigma.shape[0]
    w0   = np.ones(n) / n       # equal weight as starting point

    def objective(w):
        rc   = risk_contribution(w, Sigma)
        # Penalise deviations from equal contribution
        target = rc.sum() / n
        return np.sum((rc - target)**2)

    result = minimize(objective, w0,
                      method="SLSQP",
                      bounds=[(0.01, 1.0)] * n,
                      constraints={"type": "eq", "fun": lambda w: w.sum() - 1})
    w_opt = result.x
    rc    = risk_contribution(w_opt, Sigma)
    sigma = np.sqrt(w_opt @ Sigma @ w_opt)
    print(f"Weights:   {w_opt.round(4)}")
    print(f"Risk ctb:  {rc.round(6)}  (should be equal)")
    print(f"Portfolio vol: {sigma:.4f}")
    return w_opt

# 3-asset example: equity (high vol), bond (low vol), commodity (mid vol)
vols      = np.array([0.20, 0.05, 0.15])
corr      = np.array([[1.0, -0.2, 0.3],
                      [-0.2, 1.0, 0.1],
                      [0.3,  0.1, 1.0]])
Sigma     = np.diag(vols) @ corr @ np.diag(vols)
risk_parity_weights(Sigma)`,
    explanation: "Risk parity allocates capital so each asset contributes equally to portfolio volatility, naturally under-weighting high-volatility equities and over-weighting bonds; it implicitly leverages the bond allocation to achieve a balanced risk budget, which is why it performs well in diversified multi-asset portfolios.",
  },
  {
    id: "pyfin-20260725-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter spread estimation for pairs trading",
    tag: "time-series",
    code: `import numpy as np

def kalman_pairs(y, x, delta=1e-4, R_noise=0.001):
    """
    Kalman filter to estimate a time-varying hedge ratio β_t:
      y_t = α_t + β_t * x_t + ε_t

    State vector: θ = [α, β]'
    Transition:   θ_t = θ_{t-1} + w_t   (random walk state)
    Observation:  y_t = [1, x_t] θ_t + ε_t

    delta: state noise variance (controls how fast β is allowed to change)
    R_noise: observation noise variance (fit vs tracking speed trade-off)
    """
    n   = len(y)
    Q   = delta / (1 - delta) * np.eye(2)   # state noise covariance
    R   = R_noise                            # observation noise

    # Initialise
    theta = np.zeros((n, 2))       # [alpha, beta] at each time
    P     = np.zeros((2, 2))       # state covariance

    spreads = np.zeros(n)
    for t in range(n):
        F  = np.array([1.0, x[t]])   # observation matrix
        # Prediction step
        P  = P + Q
        # Innovation
        e  = y[t] - F @ theta[t - 1] if t > 0 else 0.0
        S  = float(F @ P @ F) + R    # innovation covariance
        K  = P @ F / S               # Kalman gain
        # Update
        if t > 0:
            theta[t] = theta[t-1] + K * e
        P     = (np.eye(2) - np.outer(K, F)) @ P
        spreads[t] = y[t] - theta[t] @ F

    alpha, beta = theta[:, 0], theta[:, 1]
    z_score = (spreads - spreads.mean()) / (spreads.std() + 1e-10)
    return alpha, beta, spreads, z_score

np.random.seed(42)
x   = np.cumsum(np.random.normal(0, 1, 300))
y   = 1.5 * x + np.random.normal(0, 0.3, 300)  # beta≈1.5, noisy
alpha, beta, spread, z = kalman_pairs(y, x)
print(f"Final beta: {beta[-1]:.4f}  (true=1.5)")
print(f"Z-score range: [{z.min():.2f}, {z.max():.2f}]")`,
    explanation: "The Kalman filter estimates a time-varying hedge ratio rather than a fixed OLS beta, adapting as the cointegrating relationship between two assets evolves; the z-score of the Kalman-filtered spread is the standard entry/exit signal in statistical arbitrage pairs strategies.",
  },
  {
    id: "pyfin-20260725-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Model for bull/bear regime detection",
    tag: "time-series",
    code: `import numpy as np

def hmm_baum_welch(returns, n_states=2, n_iter=50):
    """
    Fit a Gaussian HMM to return data via Baum-Welch (EM).
    States: 0 = low-vol (bull), 1 = high-vol (bear).
    Outputs: transition matrix A, means mu, stds sigma, smoothed state probs.
    """
    T = len(returns)
    r = np.asarray(returns)

    # Initialise: split into above/below median
    med  = np.median(r)
    mu   = np.array([r[r >= med].mean(), r[r < med].mean()])
    sig  = np.array([r[r >= med].std() + 1e-6, r[r < med].std() + 1e-6])
    A    = np.array([[0.95, 0.05], [0.10, 0.90]])  # sticky transitions
    pi   = np.array([0.5, 0.5])

    def gaussian(x, m, s):
        return np.exp(-0.5*((x-m)/s)**2) / (s * np.sqrt(2*np.pi))

    for _ in range(n_iter):
        # E-step: forward-backward
        B      = np.column_stack([gaussian(r, mu[k], sig[k]) for k in range(n_states)])
        alpha  = np.zeros((T, n_states))
        alpha[0] = pi * B[0]
        alpha[0] /= alpha[0].sum()
        for t in range(1, T):
            alpha[t] = (alpha[t-1] @ A) * B[t]
            alpha[t] /= alpha[t].sum() + 1e-300

        beta    = np.ones((T, n_states))
        for t in range(T-2, -1, -1):
            beta[t] = A @ (B[t+1] * beta[t+1])
            beta[t] /= beta[t].sum() + 1e-300

        gamma   = alpha * beta
        gamma  /= gamma.sum(axis=1, keepdims=True)

        # M-step: update parameters
        A_new = np.zeros((n_states, n_states))
        for t in range(T-1):
            xi_t  = alpha[t, :, None] * A * B[t+1] * beta[t+1]
            A_new += xi_t / (xi_t.sum() + 1e-300)
        A     = A_new / (A_new.sum(axis=1, keepdims=True) + 1e-300)
        for k in range(n_states):
            gk     = gamma[:, k]
            mu[k]  = (gk * r).sum() / gk.sum()
            sig[k] = np.sqrt((gk * (r - mu[k])**2).sum() / gk.sum()) + 1e-6

    bull_state = np.argmax(mu)
    bear_state = 1 - bull_state
    print(f"Bull: mu={mu[bull_state]:.4f}  sigma={sig[bull_state]:.4f}")
    print(f"Bear: mu={mu[bear_state]:.4f}  sigma={sig[bear_state]:.4f}")
    return gamma, A, mu, sig

np.random.seed(0)
bull = np.random.normal(0.001, 0.01, 300)
bear = np.random.normal(-0.002, 0.025, 100)
returns = np.concatenate([bull[:200], bear, bull[200:]])
gamma, A, mu, sig = hmm_baum_welch(returns)`,
    explanation: "The Baum-Welch algorithm fits a Hidden Markov Model by iterating the forward-backward (E-step) and parameter updates (M-step) until convergence; the smoothed state probabilities γ identify high-volatility bear regimes that a simple threshold rule misses when transitioning gradually.",
  },
  {
    id: "pyfin-20260725-b1-cva-swap",
    language: "python",
    title: "CVA for an interest rate swap (unilateral)",
    tag: "credit",
    code: `import numpy as np

def swap_mtm(fixed_rate, pay_dates, curve_df):
    """
    Mark-to-market of a pay-fixed IRS at each date.
    MTM = Σ (forward_rate_i - fixed) * dcf_i * df(T_i)
    """
    fwd_rates = []
    dfs       = []
    for i, T in enumerate(pay_dates):
        T_prev = pay_dates[i-1] if i > 0 else 0.0
        df_T   = curve_df(T)
        df_prev= curve_df(T_prev)
        dcf    = T - T_prev
        fwd_r  = (df_prev / df_T - 1) / dcf   # simple forward rate
        mtm_i  = (fwd_r - fixed_rate) * dcf * df_T
        fwd_rates.append(fwd_r)
        dfs.append(df_T)
    return sum(fwd_rates[i] - fixed_rate) * dfs[i] for i, _ in enumerate(pay_dates))

def cva_swap(fixed_rate, notional, pay_dates, curve_df,
             hazard_rate, recovery=0.40, n_mc=20_000):
    """
    Unilateral CVA via Monte Carlo simulation of the counterparty's survival.
    CVA = (1-R) * integral E[max(MTM(t), 0)] * q(t) dt
    where q(t) = -dQ/dt is the default intensity.
    Uses simplified flat rate curve and constant hazard rate.
    """
    np.random.seed(0)
    dt          = 0.25   # quarterly evaluation dates
    eval_dates  = np.arange(dt, pay_dates[-1] + dt, dt)
    tau         = np.random.exponential(1 / hazard_rate, n_mc)  # default times

    cva = 0.0
    for t in eval_dates:
        in_default  = (tau < t)                          # already defaulted
        survival    = np.mean(~in_default)               # Q(tau > t)
        df_t        = curve_df(t)

        # Approximate current MTM at time t (simplified: use initial MTM scaled)
        # In production, re-value the swap at each simulation date
        mtm_approx  = notional * (fixed_rate - 0.045) * (pay_dates[-1] - t)
        exposure    = max(mtm_approx, 0)                 # positive exposure only

        intensity_dt = hazard_rate * dt
        cva += (1 - recovery) * exposure * survival * intensity_dt

    print(f"Unilateral CVA: {cva * notional:.2f}")
    return cva

# Flat discount curve at 4.5%
def df_flat(T, r=0.045): return np.exp(-r * T)

cva_swap(fixed_rate=0.05, notional=1_000_000,
         pay_dates=[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
         curve_df=df_flat, hazard_rate=0.02)`,
    explanation: "CVA is the market value of counterparty credit risk: it equals the discounted expected positive exposure weighted by the probability of default times loss-given-default; a receive-fixed swap has positive exposure when rates fall (MTM rises) and zero exposure otherwise, creating an asymmetric credit risk profile.",
  },
  {
    id: "pyfin-20260725-b1-fx-carry",
    language: "python",
    title: "FX carry strategy with interest rate differentials",
    tag: "fx",
    code: `import numpy as np
import pandas as pd

def fx_carry_strategy(spot_series, rate_diff_series, transaction_cost=0.0002):
    """
    FX carry trade: borrow low-rate currency, invest in high-rate currency.
    Signal: interest rate differential (positive → long high-rate currency).
    Return = spot return + interest differential - transaction costs.

    Uncovered Interest Parity (UIP) predicts carry returns = 0,
    but empirically carry has been profitable (UIP puzzle / forward premium anomaly).
    """
    spots  = np.asarray(spot_series)
    rd     = np.asarray(rate_diff_series)   # annualised, daily: r_high - r_low

    # Signal: long when rate differential is positive
    position = np.sign(rd[:-1])             # +1 long, -1 short

    # Daily spot return (log return)
    fx_ret   = np.diff(np.log(spots))

    # Carry return: collect rate differential daily
    carry_ret = rd[:-1] / 252

    # Gross return
    gross     = position * (fx_ret + carry_ret)

    # Transaction costs: round-trip cost on position changes
    turnover  = np.abs(np.diff(position))
    net       = gross - turnover * transaction_cost

    # Performance metrics
    ann_ret   = net.mean() * 252
    ann_vol   = net.std()  * np.sqrt(252)
    sharpe    = ann_ret / ann_vol
    max_dd    = (np.cumsum(net) - np.maximum.accumulate(np.cumsum(net))).min()

    print(f"Annual return: {ann_ret:.2%}")
    print(f"Annual vol:    {ann_vol:.2%}")
    print(f"Sharpe ratio:  {sharpe:.2f}")
    print(f"Max drawdown:  {max_dd:.2%}")
    return net

np.random.seed(7)
n = 500
# Simulate: spot drifts slightly against carry (UIP partial reversion)
rd    = np.full(n, 0.04 / 252)          # 4% annual rate diff
noise = np.random.normal(0, 0.005, n)
spots = 100 * np.exp(np.cumsum(-0.01/252 + noise))  # slight adverse drift
fx_carry_strategy(spots, rd)`,
    explanation: "The FX carry trade harvests the interest rate differential between two currencies and has historically generated Sharpe ratios around 0.5; it suffers from crash risk (sudden sharp reversals during risk-off episodes) because carry returns are negatively skewed—a classic peso problem.",
  },
  {
    id: "pyfin-20260725-b1-svi-vol",
    language: "python",
    title: "SVI (Stochastic Volatility Inspired) parametric vol surface",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_raw(k, a, b, rho, m, sigma):
    """
    Gatheral's Raw SVI parametrisation of the implied variance smile:
      w(k) = a + b * [rho*(k-m) + sqrt((k-m)^2 + sigma^2)]

    k     = log-moneyness = log(K/F)
    w(k)  = total implied variance (sigma_iv^2 * T)
    a     = overall level of variance
    b     = slope of the wings (must be >= 0)
    rho   = correlation / skew (must be in (-1, 1))
    m     = ATM offset
    sigma = curvature of the smile at ATM (must be > 0)

    Arbitrage-free conditions: b >= 0, |rho| < 1, a >= -b*sigma*sqrt(1-rho^2)
    """
    disc  = np.sqrt((k - m)**2 + sigma**2)
    return a + b * (rho * (k - m) + disc)

def fit_svi(log_moneyness, impl_var):
    """Fit SVI to observed implied total variance w = sigma^2 * T."""
    def sse(p):
        a, b, rho, m, sigma = p
        if b < 0 or abs(rho) >= 1 or sigma <= 0:
            return 1e10
        # Lee moment condition: b * (1 + abs(rho)) <= 4 / T  (take T=1)
        if b * (1 + abs(rho)) > 4:
            return 1e10
        return np.sum((svi_raw(log_moneyness, a, b, rho, m, sigma) - impl_var)**2)

    result = minimize(sse, x0=[0.04, 0.1, -0.3, 0.0, 0.1],
                      method="Nelder-Mead",
                      options={"maxiter": 5000, "fatol": 1e-12})
    a, b, rho, m, sigma = result.x
    print(f"a={a:.4f}  b={b:.4f}  rho={rho:.4f}  m={m:.4f}  sig={sigma:.4f}")
    return result.x

# Simulate a typical equity smile (negative skew)
k   = np.linspace(-0.5, 0.3, 20)
w   = svi_raw(k, a=0.04, b=0.1, rho=-0.4, m=0.0, sigma=0.15)
params = fit_svi(k, w + np.random.normal(0, 1e-4, len(w)))
fitted = svi_raw(k, *params)
print(f"Max error: {np.abs(fitted - w).max()*100:.4f}% vol pts")`,
    explanation: "SVI is the industry-standard parametric smile model in equity options because it has only five interpretable parameters, guarantees no calendar spread arbitrage when calibrated per expiry, and satisfies Roger Lee's asymptotic moment formula for large strikes.",
  },
  {
    id: "pyfin-20260725-b1-cds-pricing",
    language: "python",
    title: "CDS pricing: premium leg and protection leg",
    tag: "credit",
    code: `import numpy as np

def cds_price(spread, hazard_rates, tenors, recovery=0.40, r=0.05):
    """
    Price a CDS with a given par spread against a bootstrapped hazard curve.
    Compares to the par spread by computing premium leg and protection leg.

    spread       : coupon rate to be priced (annualised)
    hazard_rates : piecewise-constant hazard λ between tenors
    tenors       : [T_0, T_1, ..., T_n] endpoints
    Returns:     (RPV01 — risky annuity, Protection Leg PV, upfront PV)
    """
    # Compute survival probabilities and discount factors
    def survival(T):
        s = 1.0
        prev = 0.0
        for lam, t in zip(hazard_rates, tenors[1:]):
            dt = min(T, t) - prev
            s *= np.exp(-lam * dt)
            if T <= t:
                break
            prev = t
        return s

    def df(T):
        return np.exp(-r * T)

    # Risky PV01 (RPV01): present value of 1bp per year if no default
    dt        = 0.25    # quarterly premium payments
    pay_dates = np.arange(dt, tenors[-1] + dt, dt)
    rpv01     = sum(dt * df(t) * survival(t) for t in pay_dates)

    # Protection leg: PV of recovery-adjusted default payment
    n_integral = 200
    t_grid     = np.linspace(0, tenors[-1], n_integral + 1)
    prot_leg   = 0.0
    for i in range(n_integral):
        t_mid  = 0.5 * (t_grid[i] + t_grid[i+1])
        lam    = hazard_rates[min(i // (n_integral // len(hazard_rates)),
                                  len(hazard_rates)-1)]
        dQ     = lam * survival(t_mid) * (t_grid[i+1] - t_grid[i])
        prot_leg += (1 - recovery) * df(t_mid) * dQ

    # Par spread: s* such that prot_leg = s* * rpv01
    par_spread = prot_leg / rpv01
    # Upfront PV of paying \`spread\` vs par
    upfront    = (spread - par_spread) * rpv01

    print(f"RPV01:       {rpv01:.4f}")
    print(f"Protection:  {prot_leg:.6f}")
    print(f"Par spread:  {par_spread*10000:.2f} bp")
    print(f"Upfront PV:  {upfront:.6f}")
    return rpv01, prot_leg, upfront

cds_price(spread=0.012, hazard_rates=[0.01, 0.012, 0.014, 0.016],
          tenors=[0, 1, 2, 3, 5])`,
    explanation: "CDS pricing balances the premium leg (RPV01 × spread) against the protection leg (expected recovery-adjusted loss); the par spread is the coupon at which these legs are equal, and any deviation is settled as an upfront payment — this is the standard ISDA CDS pricing convention since the 2009 'Big Bang' protocol.",
  },
  {
    id: "pyfin-20260725-b1-bond-convexity",
    language: "python",
    title: "Bond price, modified duration, and convexity",
    tag: "rates",
    code: `import numpy as np

def bond_analytics(coupon_rate, face, ytm, n_periods, freq=2):
    """
    Compute bond price, modified duration, and convexity.
    freq=2 for semi-annual coupons (standard US Treasury convention).

    Modified duration: -(1/P) * dP/dy  ← measures price sensitivity to yield
    Convexity:        (1/P) * d^2P/dy^2 ← second-order correction (always positive)

    Price change approximation:
      dP/P ≈ -ModDur * dy + 0.5 * Convexity * dy^2
    """
    c   = coupon_rate * face / freq   # periodic coupon payment
    y   = ytm / freq                  # periodic yield
    n   = n_periods                   # number of periods

    t_grid = np.arange(1, n + 1)      # periods: 1, 2, ..., n
    cf     = np.full(n, c)
    cf[-1] += face                    # add face value to last period

    pv      = cf / (1 + y)**t_grid    # present values of each cash flow
    P       = pv.sum()

    # Macaulay duration: weighted average time (in periods)
    mac_dur = (pv * t_grid).sum() / P / freq   # convert to years

    # Modified duration
    mod_dur = mac_dur / (1 + y)

    # Dollar duration (DV01)
    dv01    = mod_dur * P * 0.0001

    # Convexity (in years squared)
    convex  = ((pv * t_grid * (t_grid + 1)).sum() / P
               / (1 + y)**2 / freq**2)

    print(f"Price:         {P:.4f}")
    print(f"Mac. duration: {mac_dur:.4f} years")
    print(f"Mod. duration: {mod_dur:.4f}")
    print(f"DV01:          {dv01:.4f}")
    print(f"Convexity:     {convex:.4f}")

    # P&L estimate for +50bp yield shock
    dy = 0.005
    dP_approx = P * (-mod_dur * dy + 0.5 * convex * dy**2)
    print(f"Est dP for +50bp: {dP_approx:.4f}  ({dP_approx/P*100:.2f}%)")
    return P, mod_dur, convex

# 5% semi-annual coupon 10-year bond, priced at par (ytm=5%)
bond_analytics(coupon_rate=0.05, face=100, ytm=0.05, n_periods=20, freq=2)`,
    explanation: "Modified duration is the linear price-yield sensitivity and convexity is the curvature correction: a bond with higher convexity outperforms its duration estimate for large yield moves in either direction, so convexity is valuable when volatility is high—the bond is 'long gamma' relative to its duration.",
  },
  {
    id: "pyfin-20260725-b1-engle-granger",
    language: "python",
    title: "Engle-Granger cointegration and pairs trading signal",
    tag: "time-series",
    code: `import numpy as np
from scipy.stats import norm

def engle_granger_pairs(y, x, entry_z=2.0, exit_z=0.5):
    """
    Engle-Granger two-step cointegration test and pairs trading signal.
    Step 1: OLS regression y = alpha + beta*x + spread
    Step 2: ADF test on spread for stationarity (simplified: check mean reversion)
    Signal: z-score of the spread — enter at +/-entry_z, exit at +/-exit_z
    """
    # Step 1: estimate cointegrating regression
    X    = np.column_stack([np.ones(len(x)), x])
    beta = np.linalg.lstsq(X, y, rcond=None)[0]  # [alpha, beta]
    spread = y - X @ beta                          # stationary spread (if cointegrated)

    # Spread standardisation using rolling window
    window = 60
    mu  = np.array([spread[max(0,t-window):t+1].mean() for t in range(len(spread))])
    sig = np.array([spread[max(0,t-window):t+1].std() + 1e-10 for t in range(len(spread))])
    z   = (spread - mu) / sig

    # Simple ADF proxy: test mean reversion via OLS on lagged spread
    d_spread  = np.diff(spread)
    lag_spread= spread[:-1]
    phi       = np.dot(lag_spread - lag_spread.mean(), d_spread) / \
                np.dot(lag_spread - lag_spread.mean(), lag_spread - lag_spread.mean())
    print(f"OLS hedge ratio: {beta[1]:.4f}  intercept: {beta[0]:.4f}")
    print(f"Mean reversion coeff phi: {phi:.4f}  (negative → mean-reverting)")
    print(f"Half-life: {-np.log(2)/phi:.1f} days" if phi < 0 else "Not mean-reverting")

    # Trading signal
    signal = np.where(z > entry_z, -1,    # short the spread
              np.where(z < -entry_z, 1,    # long the spread
              np.where(np.abs(z) < exit_z, 0,
              np.nan)))
    # Forward-fill signal through exit zones
    last = 0
    for i in range(len(signal)):
        if np.isnan(signal[i]):
            signal[i] = last
        else:
            last = signal[i]

    return beta, spread, z, signal

np.random.seed(5)
common = np.cumsum(np.random.normal(0, 1, 500))
x      = common + np.random.normal(0, 0.5, 500)
y      = 1.3 * common - 0.5 + np.random.normal(0, 0.5, 500)
beta, spread, z, sig = engle_granger_pairs(y, x)
print(f"Signal distribution: long={int((sig==1).sum())} short={int((sig==-1).sum())}")`,
    explanation: "The Engle-Granger procedure tests for cointegration by checking whether the OLS regression residual (spread) is stationary; the half-life of mean reversion (ln2 / |φ|) determines the appropriate holding period—spreads with a half-life under 10 days are typically too fast, while over 30 days may have too much market risk.",
  },
  {
    id: "pyfin-20260725-b1-market-impact",
    language: "python",
    title: "Square-root market impact and Almgren-Chriss cost model",
    tag: "execution",
    code: `import numpy as np

def sqrt_impact_cost(shares, adv, sigma, eta=0.1, gamma=0.01):
    """
    Square-root law for temporary market impact:
      Impact ≈ eta * sigma * sqrt(shares / ADV)

    eta  : temporary impact coefficient (varies by venue/stock)
    sigma: daily volatility (fraction)
    adv  : average daily volume

    Total execution cost decomposes into:
      - temporary impact: paid each trade, partially recovers
      - permanent impact: shifts the underlying price for all future trades
    """
    pov   = shares / adv                  # participation rate (fraction of ADV)
    temp  = eta * sigma * np.sqrt(pov)    # temporary impact (fraction of price)
    perm  = gamma * pov                   # permanent impact
    total = temp + perm

    print(f"Participation rate: {pov:.2%}")
    print(f"Temporary impact:   {temp*100:.2f} bps")
    print(f"Permanent impact:   {perm*100:.2f} bps")
    print(f"Total impact:       {total*100:.2f} bps")
    return temp, perm

def almgren_chriss_cost(X0, T, N, sigma, eta, gamma):
    """
    Total expected execution cost for optimal AC trajectory.
    E[cost] = gamma/2 * X0^2 + eta * integral(n_t^2 dt)
    """
    dt     = T / N
    kappa  = np.sqrt(gamma / eta)               # urgency
    X_end  = 0.0                                # must liquidate fully
    # Optimal trajectory (simplified: TWAP for illustration)
    n_t    = np.full(N, X0 / N / dt)           # uniform trading rate
    # Temporary impact cost
    temp   = eta * np.sum(n_t**2) * dt
    perm   = gamma * X0**2 / 2
    print(f"TWAP temporary impact: {temp:.4f}")
    print(f"Permanent impact:      {perm:.4f}")
    return temp, perm

print("=== Square-root impact ===")
sqrt_impact_cost(shares=50_000, adv=1_000_000, sigma=0.015)

print("\\n=== Almgren-Chriss trajectory cost ===")
almgren_chriss_cost(X0=1_000_000, T=1.0, N=10, sigma=0.015, eta=1e-6, gamma=5e-7)`,
    explanation: "The square-root law states that market impact scales with the square root of trade size relative to average volume; the Almgren-Chriss model makes this precise by decomposing total execution cost into temporary (price recovers) and permanent (price shift persists) components, with the optimal schedule balancing speed against impact.",
  },
  {
    id: "pyfin-20260725-b1-fama-french",
    language: "python",
    title: "Fama-French 3-factor return decomposition",
    tag: "factor-models",
    code: `import numpy as np

def fama_french_attribution(returns, mkt_rf, smb, hml, rf,
                             window=None):
    """
    Regress portfolio returns on Fama-French 3 factors:
      r_t - rf_t = alpha + beta_mkt*(Mkt-Rf)_t + beta_smb*SMB_t + beta_hml*HML_t + eps_t

    mkt_rf : market excess return (Mkt - Rf)
    smb    : Small Minus Big size factor
    hml    : High Minus Low value factor
    rf     : risk-free rate per period

    Returns alpha (annualised), factor betas, t-stats, R^2
    """
    r = np.asarray(returns) - np.asarray(rf)   # excess portfolio return
    X = np.column_stack([np.ones(len(r)),
                          np.asarray(mkt_rf),
                          np.asarray(smb),
                          np.asarray(hml)])

    # OLS: beta = (X'X)^{-1} X'r
    beta = np.linalg.lstsq(X, r, rcond=None)[0]
    fitted   = X @ beta
    resid    = r - fitted
    n, k     = X.shape
    sse      = resid @ resid
    sst      = ((r - r.mean()) ** 2).sum()
    r_sq     = 1 - sse / sst

    # Standard errors
    sigma2   = sse / (n - k)
    cov_beta = sigma2 * np.linalg.inv(X.T @ X)
    se       = np.sqrt(np.diag(cov_beta))
    t_stats  = beta / se

    alpha_ann = beta[0] * 252   # annualise daily alpha
    print(f"Alpha (ann.):    {alpha_ann:.4%}  t={t_stats[0]:.2f}")
    print(f"Beta_Mkt:        {beta[1]:.4f}   t={t_stats[1]:.2f}")
    print(f"Beta_SMB:        {beta[2]:.4f}   t={t_stats[2]:.2f}")
    print(f"Beta_HML:        {beta[3]:.4f}   t={t_stats[3]:.2f}")
    print(f"R-squared:       {r_sq:.4f}")
    return beta, t_stats, r_sq

np.random.seed(42)
n = 500
mkt_rf = np.random.normal(0.0003, 0.01, n)
smb    = np.random.normal(0.0001, 0.005, n)
hml    = np.random.normal(0.0001, 0.004, n)
rf     = np.full(n, 0.00015)
# Portfolio: 1.1 beta, mild size tilt, value tilt, and positive alpha
r_port = 0.0001 + 1.1*mkt_rf + 0.3*smb + 0.2*hml + np.random.normal(0, 0.003, n)
fama_french_attribution(r_port, mkt_rf, smb, hml, rf)`,
    explanation: "The Fama-French three-factor model decomposes portfolio returns into market (beta), size (SMB), and value (HML) exposures; the intercept alpha measures skill net of systematic factor exposure—a manager with a high market beta but zero alpha is simply taking leveraged market risk, not generating value.",
  },
  {
    id: "pyfin-20260725-b1-quantlib-bond",
    language: "python",
    title: "QuantLib fixed-coupon bond pricing",
    tag: "rates",
    code: `# Requires: pip install QuantLib
import QuantLib as ql

def ql_bond_price(coupon_rate, maturity_years, ytm, face=1000.0, freq=ql.Semiannual):
    """
    Price a fixed-coupon bond using QuantLib's full date/calendar machinery.
    This handles day-count conventions, holiday calendars, and stub periods
    that manual formula implementations miss.
    """
    today      = ql.Date.todaysDate()
    ql.Settings.instance().evaluationDate = today

    maturity   = today + ql.Period(int(maturity_years * 12), ql.Months)
    calendar   = ql.UnitedStates(ql.UnitedStates.GovernmentBond)
    day_count  = ql.ActualActual(ql.ActualActual.Bond)  # ISMA day-count
    convention = ql.ModifiedFollowing

    schedule = ql.Schedule(
        today, maturity, ql.Period(freq), calendar,
        convention, convention,
        ql.DateGeneration.Backward, False)

    coupons = [coupon_rate]
    bond = ql.FixedRateBond(0, face, schedule, coupons, day_count)

    # Flat yield curve for discounting
    flat_curve = ql.FlatForward(today, ql.QuoteHandle(ql.SimpleQuote(ytm)),
                                day_count)
    engine = ql.DiscountingBondEngine(
        ql.RelinkableYieldTermStructureHandle(flat_curve))
    bond.setPricingEngine(engine)

    price     = bond.cleanPrice()     # clean price (excludes accrued interest)
    dirty     = bond.dirtyPrice()     # dirty = clean + accrued
    dur       = ql.BondFunctions.duration(bond, ql.InterestRate(ytm, day_count, ql.Compounded, freq))
    convex    = ql.BondFunctions.convexity(bond, ql.InterestRate(ytm, day_count, ql.Compounded, freq))

    print(f"Clean price:      {price:.4f}")
    print(f"Dirty price:      {dirty:.4f}")
    print(f"Modified duration:{dur:.4f}")
    print(f"Convexity:        {convex:.4f}")
    return price, dur, convex

try:
    ql_bond_price(coupon_rate=0.05, maturity_years=10, ytm=0.05)
except ImportError:
    print("QuantLib not installed — run: pip install QuantLib")`,
    explanation: "QuantLib handles the real-world complexity of bond pricing that manual formulas ignore: actual/actual day count (each period's fraction depends on the exact calendar), modified-following business day adjustment for coupons falling on weekends, and backward date generation from maturity to settle stubs correctly.",
  },
];
