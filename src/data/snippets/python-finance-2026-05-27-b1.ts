import type { Snippet } from "./types";

export const pythonFinanceSnippets20260527B1: Snippet[] = [
  {
    id: "pyfin-20260527-b1-g2plus",
    language: "python",
    title: "G2++ two-factor Gaussian short rate model",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def g2pp_zcb(a: float, b: float, sigma: float, eta: float, rho: float,
              phi_T: float, T: float, f0: float = 0.05) -> float:
    """
    G2++ (Brigo-Mercurio): r(t) = x(t) + y(t) + phi(t)
    dx = -a*x dt + sigma*dW1,  dy = -b*y dt + eta*dW2,  corr = rho.
    phi(t) shifts the model to fit the initial curve exactly.
    Closed-form ZCB:  P(0,T) = exp(-A(T) - B(a,T)*x0 - B(b,T)*y0)
    where B(k,T) = (1-exp(-k*T))/k.
    For demonstration we set x0=y0=0 and absorb the initial curve via phi.
    """
    def B(k, t): return (1.0 - np.exp(-k * t)) / k

    def V(t):
        return (sigma**2 / a**2 * (t - 2*B(a,t) + B(a,2*t)/2)
              + eta**2  / b**2 * (t - 2*B(b,t) + B(b,2*t)/2)
              + 2*rho*sigma*eta/(a*b)
                * (t - B(a,t) - B(b,t) + B(a+b,t)))

    # A(T): adjustment for initial curve (phi set to match f0 = const flat curve)
    # For a flat curve: integral_0^T phi(t) dt = f0*T (approx), minus 0.5*V(T)
    log_A = -f0 * T + 0.5 * V(T)
    return np.exp(log_A)

def g2pp_simulate(a, b, sigma, eta, rho, T, n_paths=10000, n_steps=252, seed=42):
    """
    Simulate n_paths joint (x, y) paths under G2++ using Euler-Maruyama.
    Returns array of terminal short rates r(T) = x(T) + y(T) + phi(T).
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps

    # Cholesky decomposition of [1, rho; rho, 1]
    L = np.array([[1.0, 0.0], [rho, np.sqrt(1 - rho**2)]])

    x = np.zeros(n_paths)
    y = np.zeros(n_paths)

    for _ in range(n_steps):
        z = rng.standard_normal((2, n_paths))
        dW = (L @ z) * np.sqrt(dt)        # correlated Brownian increments
        x += -a * x * dt + sigma * dW[0]
        y += -b * y * dt + eta  * dW[1]

    phi_T = 0.05  # constant phi for a flat 5% initial curve (simplification)
    return x + y + phi_T

def calibrate_g2pp(market_zcb: np.ndarray, maturities: np.ndarray) -> dict:
    """
    Calibrate G2++ to market zero-coupon bond prices via least squares.
    Returns dict of {a, b, sigma, eta, rho}.
    """
    def objective(params):
        a, b, sig, eta, rho = params
        if rho <= -1 or rho >= 1 or a <= 0 or b <= 0 or sig <= 0 or eta <= 0:
            return 1e10
        model_zcb = np.array([g2pp_zcb(a, b, sig, eta, rho, 0.05, T) for T in maturities])
        return np.sum((model_zcb - market_zcb)**2) * 1e8

    res = minimize(objective, x0=[0.5, 0.1, 0.01, 0.01, -0.3],
                   method="Nelder-Mead",
                   options={"xatol": 1e-6, "maxiter": 5000})
    a, b, sig, eta, rho = res.x
    return {"a": a, "b": b, "sigma": sig, "eta": eta, "rho": rho}


# Demo: flat 5% curve ZCBs
maturities  = np.array([0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0])
market_zcb  = np.exp(-0.05 * maturities)   # flat curve

for T in maturities:
    p = g2pp_zcb(0.5, 0.1, 0.01, 0.01, -0.3, 0.05, T)
    print(f"T={T:.1f}Y  ZCB={p:.4f}  market={np.exp(-0.05*T):.4f}")`,
    explanation:
      "G2++ extends the Hull-White model to two correlated factors, allowing the yield curve to flex in both the 'level' (first factor) and 'slope' (second factor) dimensions simultaneously. Unlike HW1F, it can reproduce humped volatility structures and non-trivial smile shapes for long-dated swaptions. The two mean-reversion speeds a and b determine how quickly each factor reverts — typically a > b, making x a fast short-end driver and y a slow long-end driver.",
  },
  {
    id: "pyfin-20260527-b1-merton-credit",
    language: "python",
    title: "Merton structural credit model — distance to default and PD",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import fsolve

def merton_pd(E: float, sigma_E: float, D: float, r: float, T: float) -> dict:
    """
    Merton (1974) firm-value structural credit model.
    Equity = call option on firm assets: E = A*N(d1) - D*e^(-rT)*N(d2).
    Observables: equity value E and equity vol sigma_E.
    Unobservables: asset value A and asset vol sigma_A.
    Solve the 2-equation system:
      (1) E = BSCall(A, D, r, sigma_A, T)
      (2) sigma_E * E = N(d1) * sigma_A * A   (Ito's lemma)
    Distance to default: DD = (ln(A/D) + (r - 0.5*sigma_A^2)*T) / (sigma_A*sqrt(T))
    Probability of default: PD = N(-DD)
    """
    def bs_call_and_d1(A, sigma_A):
        d1 = (np.log(A / D) + (r + 0.5*sigma_A**2)*T) / (sigma_A * np.sqrt(T))
        d2 = d1 - sigma_A * np.sqrt(T)
        call = A * norm.cdf(d1) - D * np.exp(-r*T) * norm.cdf(d2)
        return call, d1

    def equations(x):
        A, sA = x
        if A <= 0 or sA <= 0:
            return [1e6, 1e6]
        call, d1 = bs_call_and_d1(A, sA)
        eq1 = call - E                          # eq1: model equity = observed
        eq2 = norm.cdf(d1) * sA * A - sigma_E * E  # eq2: vol linkage via Ito
        return [eq1, eq2]

    # Initial guess: A ≈ E + D, sigma_A ≈ sigma_E * E / (E + D)
    A0   = E + D * np.exp(-r * T)
    sA0  = sigma_E * E / A0
    sol  = fsolve(equations, [A0, sA0], full_output=True)
    A_sol, sA_sol = sol[0]

    d1  = (np.log(A_sol / D) + (r + 0.5*sA_sol**2)*T) / (sA_sol * np.sqrt(T))
    d2  = d1 - sA_sol * np.sqrt(T)
    DD  = d2           # distance to default (in std devs)
    PD  = norm.cdf(-DD)

    return {
        "asset_value":   A_sol,
        "asset_vol":     sA_sol,
        "distance_to_default": DD,
        "prob_default":  PD,
        "leverage":      D * np.exp(-r*T) / A_sol,  # book leverage
    }


def credit_spread(sigma_A: float, D: float, A: float, r: float, T: float) -> float:
    """
    Merton credit spread: s = -log(N(d2) + (A/D)*exp(rT)*N(-d1)) / T - r
    Simplification: s ≈ (1/T)*log((1-PD*(1-R)) / N(d2)) for small spreads.
    """
    d1 = (np.log(A / D) + (r + 0.5*sigma_A**2)*T) / (sigma_A * np.sqrt(T))
    d2 = d1 - sigma_A * np.sqrt(T)
    # Merton risky bond price = riskless - put value
    put   = D*np.exp(-r*T)*norm.cdf(-d2) - A*norm.cdf(-d1)
    bond  = D * np.exp(-r*T) - put
    if bond <= 0: return 1.0
    return -np.log(bond / (D * np.exp(-r*T))) / T


# Demo: tech company with moderate leverage
result = merton_pd(E=500e6, sigma_E=0.35, D=400e6, r=0.05, T=1.0)
print(f"Asset value:        \${result['asset_value']/1e6:.1f}M")
print(f"Asset vol:          {result['asset_vol']:.3f}")
print(f"Distance to default:{result['distance_to_default']:.2f} sigmas")
print(f"Prob of default:    {result['prob_default']*100:.2f}%")
print(f"Leverage (mkt):     {result['leverage']:.2f}")

s = credit_spread(result["asset_vol"], 400e6, result["asset_value"], 0.05, 1.0)
print(f"Credit spread:      {s*10000:.1f} bps")`,
    explanation:
      "Merton's structural model treats equity as a call option on firm assets, providing a direct link between equity prices (observable) and credit spreads (less liquid). The KMV adaptation popularised by Moody's estimates the asset value and volatility from equity prices, then computes the distance to default (DD) in units of asset volatility standard deviations. Empirically, PD = N(-DD) underestimates actual default rates — KMV uses an empirical mapping from DD to default frequency instead of the normal CDF.",
  },
  {
    id: "pyfin-20260527-b1-bermudan-lsm",
    language: "python",
    title: "Bermudan swaption pricing via LSM (exercise on coupon dates)",
    tag: "finance",
    code: `import numpy as np

def hull_white_paths(a: float, sigma: float, r0: float,
                      dt: float, n_steps: int, n_paths: int,
                      seed: int = 42) -> np.ndarray:
    """
    Hull-White 1F simulation (Euler): dr = a*(theta(t) - r)*dt + sigma*dW.
    For calibration simplicity, use flat theta = r0 (mean-reversion target).
    Returns array of shape (n_steps+1, n_paths).
    """
    rng  = np.random.default_rng(seed)
    r    = np.full(n_paths, r0)
    paths = np.zeros((n_steps+1, n_paths))
    paths[0] = r
    for i in range(n_steps):
        dW = rng.standard_normal(n_paths) * np.sqrt(dt)
        r  = r + a * (r0 - r) * dt + sigma * dW
        paths[i+1] = r
    return paths


def bermudan_payer_swaption(
        r_paths: np.ndarray,        # (n_steps+1, n_paths)
        strike: float,              # fixed rate K
        dt: float,                  # time step in years
        exercise_steps: list[int],  # indices where early exercise is possible
        freq: int = 2,              # coupon frequency per year
        n_remaining: int = 4        # swap tenor after each exercise (in periods)
) -> float:
    """
    Bermudan payer swaption: at each exercise date, holder can enter a
    fixed-rate payer swap (pay K, receive floating).
    LSM approach: at each exercise step, regress continuation value onto r.
    Payoff at exercise: annuity * (swap_rate(t) - K) if > 0.
    """
    n_steps, n_paths = r_paths.shape[0] - 1, r_paths.shape[1]
    disc = np.exp(-r_paths * dt)      # per-step discount factors

    # Intrinsic value: approximate swap payoff at step t_i
    # Par swap rate ≈ (1 - df(T)) / annuity; use flat discount df = exp(-r * tau)
    def swap_value(step: int) -> np.ndarray:
        r = r_paths[step]
        tau = n_remaining * (1.0 / freq)
        df_T  = np.exp(-r * tau)
        ann   = (1.0 - df_T) / (r + 1e-8)   # ≈ annuity for par rate r
        par_rate = (1.0 - df_T) / (ann + 1e-8)
        return ann * np.maximum(par_rate - strike, 0.0)   # payer swaption payoff

    # Backward induction with LSM
    cash_flow = swap_value(n_steps)   # value at last exercise date = expiry

    for step in reversed(exercise_steps[:-1]):
        # Discount cash flows one period forward
        cont_disc = cash_flow * np.prod(disc[step:step+2], axis=0)

        intrinsic = swap_value(step)
        itm       = intrinsic > 0
        if itm.sum() < 10:
            cash_flow = cont_disc
            continue

        # Regress continuation on r (basis: 1, r, r^2)
        r_itm = r_paths[step, itm]
        X     = np.column_stack([np.ones(itm.sum()), r_itm, r_itm**2])
        beta, *_ = np.linalg.lstsq(X, cont_disc[itm], rcond=None)
        est_cont = X @ beta

        # Exercise where intrinsic > estimated continuation
        exercise = intrinsic[itm] > est_cont
        cash_flow[itm] = np.where(exercise, intrinsic[itm], cont_disc[itm])
        cash_flow[~itm] = cont_disc[~itm]

    # Discount back to time 0
    return float(cash_flow.mean() * np.exp(-r_paths[0].mean() * exercise_steps[0] * dt))


# 2Y into 2Y Bermudan payer swaption, quarterly exercise, strike = 5%
dt          = 0.25      # quarterly steps
n_steps     = 8         # 2 years
r_paths     = hull_white_paths(a=1.0, sigma=0.015, r0=0.05,
                                dt=dt, n_steps=n_steps, n_paths=50000)
exercise_steps = list(range(1, n_steps + 1))   # exercise every quarter

price = bermudan_payer_swaption(r_paths, strike=0.05, dt=dt,
                                  exercise_steps=exercise_steps)
print(f"Bermudan payer swaption price: {price:.6f}")
# For a flat 5% curve and ATM swaption, price > European (early exercise premium)`,
    explanation:
      "Bermudan swaptions are more valuable than European swaptions because the holder can choose the optimal entry date across multiple quarterly windows. LSM handles this optimally by working backwards: at each exercise date, regress the discounted future cash flows onto functions of the state variable (short rate r) to estimate whether to exercise or continue. The short-rate-as-basis-function is key here — it summarises all the relevant information about future swap rates in the Hull-White model.",
  },
  {
    id: "pyfin-20260527-b1-entropy-pooling",
    language: "python",
    title: "Meucci entropy pooling — views on distribution via minimum KL divergence",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def entropy_pooling(p_prior: np.ndarray,
                     A_eq: np.ndarray, b_eq: np.ndarray,
                     A_ineq: np.ndarray = None, b_ineq: np.ndarray = None,
                     tol: float = 1e-8) -> np.ndarray:
    """
    Meucci (2008) Entropy Pooling: find posterior scenario weights p_post
    that satisfy a set of views while being as close as possible (in KL divergence)
    to the prior p_prior.

    Minimise  KL(p | p_prior) = sum_i p_i * log(p_i / p_prior_i)
    Subject to:
      A_eq @ p  = b_eq           (equality views: e.g., E[r1] = 0.01)
      A_ineq @ p <= b_ineq       (inequality views: e.g., P(r1 > 0) >= 0.6)
      sum(p) = 1                 (always enforced as an equality constraint)
      p_i >= 0

    The dual of this problem gives Lagrange multipliers; solve via L-BFGS-B.
    """
    n = len(p_prior)
    log_p_prior = np.log(p_prior + 1e-300)

    # Include sum(p) = 1 in the equality constraints
    ones = np.ones((1, n))
    A_eq_full = np.vstack([ones, A_eq])
    b_eq_full = np.concatenate([[1.0], b_eq])

    def neg_entropy(lam):
        # Lagrangian dual: p_post_i = p_prior_i * exp(-sum_j lam_j * A_eq_full[j,i])
        log_p = log_p_prior - A_eq_full.T @ lam
        log_p -= np.max(log_p)       # numerical stability
        p = np.exp(log_p)
        p /= p.sum()
        # Dual objective: lam^T * b_eq_full - KL
        obj = np.dot(lam, b_eq_full) - np.dot(p, np.log(p + 1e-300) - log_p_prior)
        return -obj   # maximise dual <=> minimise -dual

    n_eq = len(b_eq_full)
    lam0 = np.zeros(n_eq)
    res  = minimize(neg_entropy, lam0, method="L-BFGS-B",
                    options={"ftol": tol**2, "gtol": tol})

    lam_star = res.x
    log_p = log_p_prior - A_eq_full.T @ lam_star
    log_p -= np.max(log_p)
    p_post = np.exp(log_p)
    p_post /= p_post.sum()
    return p_post


# Demo: 500 Monte Carlo scenarios; impose a view that E[r1] = 2% (vs prior 0%)
rng     = np.random.default_rng(42)
n_scen  = 500
returns = rng.multivariate_normal([0, 0], [[0.04, 0.02], [0.02, 0.04]], size=n_scen)

p_prior = np.ones(n_scen) / n_scen

# View: E[r_asset1] = 0.02
A_eq = returns[:, 0].reshape(1, n_scen)
b_eq = np.array([0.02])

p_post = entropy_pooling(p_prior, A_eq, b_eq)

# Check view is satisfied
post_mean1 = np.dot(p_post, returns[:, 0])
post_mean2 = np.dot(p_post, returns[:, 1])   # implied view on asset 2 (informational)
post_var1  = np.dot(p_post, returns[:, 0]**2) - post_mean1**2

print(f"Prior E[r1]: {np.mean(returns[:,0]):.4f}")
print(f"Post  E[r1]: {post_mean1:.4f}  (view: 0.0200)")
print(f"Post  E[r2]: {post_mean2:.4f}  (implied view from correlation)")
print(f"Post  std[r1]: {np.sqrt(post_var1):.4f}  (vol preserved)") `,
    explanation:
      "Entropy pooling generalises Black-Litterman: it can incorporate any view (mean, quantile, covariance) as a constraint and finds the posterior scenario distribution closest to the prior in KL divergence. Unlike BL, it does not require views to be expressed as linear functions of returns — a view like 'P(r1 > 5%) = 60%' is straightforward to encode as an inequality on the scenario probabilities. The dual optimisation is convex and fast; the gradient is the vector of view constraint residuals.",
  },
  {
    id: "pyfin-20260527-b1-robust-mvo",
    language: "python",
    title: "Robust mean-variance with ellipsoidal uncertainty (cvxpy)",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

def robust_mvo(mu_hat: np.ndarray, Sigma: np.ndarray,
                kappa: float = 1.0,
                max_weight: float = 0.3,
                min_return: float = 0.05) -> np.ndarray:
    """
    Robust MVO: worst-case return over an ellipsoidal uncertainty set for mu.
    The investor is uncertain about expected returns:
        mu \\in { mu_hat + delta : delta^T * Sigma^{-1} * delta <= kappa^2 }
    The worst-case return for weights w:
        min_{mu} w^T mu  s.t. delta^T Sigma^{-1} delta <= kappa^2
        = w^T mu_hat - kappa * sqrt(w^T Sigma w)
    This is SOCP (Second Order Cone Programming) — convex.
    Large kappa -> more risk-averse to estimation error -> lower concentration.
    """
    n  = len(mu_hat)
    w  = cp.Variable(n)

    # Worst-case portfolio return (robust objective)
    port_var = cp.quad_form(w, Sigma)
    robust_return = mu_hat @ w - kappa * cp.sqrt(port_var)

    constraints = [
        cp.sum(w) == 1.0,
        w >= 0.0,
        w <= max_weight,
    ]
    if min_return is not None:
        constraints.append(mu_hat @ w >= min_return)

    prob = cp.Problem(cp.Maximize(robust_return), constraints)
    prob.solve(solver=cp.CLARABEL, verbose=False)

    if prob.status not in ["optimal", "optimal_inaccurate"]:
        return np.ones(n) / n
    return np.array(w.value)


def compare_mvo_vs_robust(mu, Sigma, kappas=(0.0, 0.5, 1.0, 2.0)):
    """
    Show how increasing kappa (ambiguity aversion) affects concentration.
    """
    print(f"{'kappa':>6}  {'HHI':>6}  {'max_w':>6}  {'port_ret':>9}")
    for kappa in kappas:
        w = robust_mvo(mu, Sigma, kappa=kappa, min_return=None)
        if w is None: continue
        hhi = np.sum(w**2)    # Herfindahl-Hirschman: 1/N = fully diversified
        print(f"{kappa:6.1f}  {hhi:.4f}  {w.max():.4f}  {(mu@w):.4f}")


# Simulated 5-asset universe
n   = 5
mu  = np.array([0.08, 0.10, 0.06, 0.12, 0.07])
cov = np.array([
    [0.04, 0.02, 0.01, 0.02, 0.01],
    [0.02, 0.09, 0.02, 0.03, 0.01],
    [0.01, 0.02, 0.03, 0.01, 0.01],
    [0.02, 0.03, 0.01, 0.16, 0.02],
    [0.01, 0.01, 0.01, 0.02, 0.02],
])

w_classic = robust_mvo(mu, cov, kappa=0.0)   # classical MVO (no robustness)
w_robust  = robust_mvo(mu, cov, kappa=1.0)   # robust MVO

print("Classic MVO weights:", np.round(w_classic, 3))
print("Robust  MVO weights:", np.round(w_robust,  3))
compare_mvo_vs_robust(mu, cov)`,
    explanation:
      "Classical MVO maximises expected return for a given variance, but is notoriously sensitive to errors in mu: a 1% perturbation in expected returns can produce wildly different portfolios. Ellipsoidal robust MVO penalises weights that are large *and* in the direction of high estimation uncertainty (captured by the covariance matrix). The result is a more diversified, less 'corner solution' portfolio. The kappa parameter quantifies risk aversion to estimation error — at kappa=0 it reduces to standard MVO.",
  },
  {
    id: "pyfin-20260527-b1-asian-cv",
    language: "python",
    title: "Asian call via geometric control variate",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def geometric_asian_call(S, K, r, sigma, T, n) -> float:
    """
    Closed-form price for a geometric average (continuous monitoring, approx):
    Geo-Asian call: S_geo ~ lognormal with adjusted drift and vol.
    sigma_adj = sigma / sqrt(3)
    r_adj     = 0.5 * (r - 0.5*sigma^2 + sigma_adj^2 * ...) — Kemna-Vorst 1990.
    """
    sigma_adj = sigma * np.sqrt((2*n + 1) / (6*(n + 1)))  # discrete monitoring adj
    mu_adj    = 0.5 * (r - 0.5*sigma**2) + 0.5 * sigma_adj**2
    d1 = (np.log(S / K) + (mu_adj + 0.5*sigma_adj**2)*T) / (sigma_adj * np.sqrt(T))
    d2 = d1 - sigma_adj * np.sqrt(T)
    return np.exp(-r*T) * (S * np.exp(mu_adj*T) * norm.cdf(d1) - K * norm.cdf(d2))


def arithmetic_asian_call_cv(S, K, r, sigma, T, n_steps=50,
                               n_paths=100000, seed=42) -> dict:
    """
    Arithmetic-average Asian call via Monte Carlo + geometric control variate.
    Variance reduction: E[payoff_arith] = E[payoff_arith - beta*(payoff_geo - E_geo)]
    where beta = Cov(payoff_arith, payoff_geo) / Var(payoff_geo).
    Control variate shrinks MC standard error by 1 - rho^2 factor (rho = correlation).
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    t    = np.linspace(dt, T, n_steps)

    # Simulate log-price increments
    z   = rng.standard_normal((n_paths, n_steps))
    log_incr = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*z
    log_S    = np.cumsum(log_incr, axis=1)    # log-price relative to S
    S_paths  = S * np.exp(log_S)              # (n_paths, n_steps)

    # Arithmetic and geometric averages
    arith_avg = S_paths.mean(axis=1)
    geo_avg   = np.exp(np.log(S_paths).mean(axis=1))   # geometric mean

    payoff_arith = np.maximum(arith_avg - K, 0.0)
    payoff_geo   = np.maximum(geo_avg   - K, 0.0)

    E_geo = geometric_asian_call(S, K, r, sigma, T, n_steps)  # closed form

    # Optimal beta for control variate
    cov_matrix = np.cov(payoff_arith, payoff_geo)
    beta = cov_matrix[0, 1] / cov_matrix[1, 1]

    # Control variate estimator
    cv_payoffs = payoff_arith - beta * (payoff_geo - np.exp(r*T) * E_geo)
    price_cv   = np.exp(-r*T) * cv_payoffs.mean()
    price_raw  = np.exp(-r*T) * payoff_arith.mean()

    # Variance reduction factor
    rho = np.corrcoef(payoff_arith, payoff_geo)[0, 1]

    return {
        "price_raw":      price_raw,
        "price_cv":       price_cv,
        "std_raw":        np.exp(-r*T) * payoff_arith.std() / np.sqrt(n_paths),
        "std_cv":         np.exp(-r*T) * cv_payoffs.std()   / np.sqrt(n_paths),
        "variance_reduction": 1 - (1 - rho**2),
        "rho_arith_geo":  rho,
        "geo_exact":      E_geo,
    }


res = arithmetic_asian_call_cv(100, 100, 0.05, 0.20, 1.0, n_steps=50, n_paths=50000)
print(f"Raw MC:  {res['price_raw']:.4f}  ± {res['std_raw']:.4f}")
print(f"CV  MC:  {res['price_cv']:.4f}  ± {res['std_cv']:.4f}")
print(f"Geo exact: {res['geo_exact']:.4f}  rho={res['rho_arith_geo']:.4f}")
print(f"Std reduction: {res['std_raw']/res['std_cv']:.1f}x")`,
    explanation:
      "The geometric Asian option is the ideal control variate for the arithmetic Asian: both depend on the same price path, giving a near-perfect correlation (typically > 0.999). The closed-form geometric price is used as the 'truth' the control variate must match, and the regression coefficient beta eliminates most of the sampling variance. This variance reduction of 10-100× means you can achieve the same accuracy with 100-10,000× fewer paths — critical when the pricer sits inside a nested simulation.",
  },
  {
    id: "pyfin-20260527-b1-lvar",
    language: "python",
    title: "Liquidity-adjusted VaR (L-VaR) with position sizing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def lvar_parametric(returns: np.ndarray, position_size: float,
                     adv: float, daily_unwind_pct: float = 0.10,
                     confidence: float = 0.99, holding_period: int = 1) -> dict:
    """
    Liquidity-adjusted VaR: VaR + Liquidity Cost.
    Liquidity cost arises because a large position cannot be exited in one day
    without moving the market — it takes N = position / (adv * daily_unwind_pct) days.
    During this liquidation period, additional mark-to-market losses accumulate.

    Two components:
    1. Market VaR: parametric 1-day VaR scaled to holding period.
    2. Bid-ask spread cost: fixed friction per dollar traded.
    3. Market impact: price moves against you as you sell.

    Based on: Bangia et al. (1999), Almgren-Chriss (2001) approximation.
    """
    mu    = returns.mean()
    sigma = returns.std(ddof=1)
    z     = norm.ppf(confidence)

    # Holding period (liquidation days)
    unwind_days = max(int(np.ceil(position_size / (adv * daily_unwind_pct))), holding_period)

    # 1. Market VaR scaled to unwind period
    sigma_T = sigma * np.sqrt(unwind_days)
    var_market = (z * sigma_T - mu * unwind_days) * position_size  # in dollars

    # 2. Liquidity cost: spread-driven (half-spread paid on round trip)
    half_spread  = 0.0010        # 10 bps half-spread assumption
    spread_cost  = half_spread * position_size   # one-way exit

    # 3. Market impact: Kyle's lambda approximation
    # Impact per dollar sold as % ADV: ~0.1% per 1% of ADV (linear impact)
    pct_adv    = position_size / adv
    impact_pct = 0.001 * pct_adv   # e.g., 5% of ADV -> 50 bps impact
    impact_cost = impact_pct * position_size

    lvar = var_market + spread_cost + impact_cost

    return {
        "1d_market_var":   z * sigma * position_size,
        "unwind_days":     unwind_days,
        "market_var_T":    var_market,
        "spread_cost":     spread_cost,
        "market_impact":   impact_cost,
        "total_lvar":      lvar,
        "lvar_premium":    (lvar - z * sigma * position_size) / (z * sigma * position_size),
    }


def lvar_scaling(returns: np.ndarray, notional: float,
                  adv_range: np.ndarray) -> None:
    """Show how L-VaR premium grows with position size vs ADV."""
    print(f"{'% ADV':>8}  {'VaR(1d)':>10}  {'Unwind':>7}  {'L-VaR':>10}  {'Premium':>8}")
    for adv in adv_range:
        pct = notional / adv * 100
        r = lvar_parametric(returns, notional, adv)
        print(f"{pct:8.1f}%  {r['1d_market_var']:10.0f}  "
              f"{r['unwind_days']:7d}d  {r['total_lvar']:10.0f}  "
              f"{r['lvar_premium']*100:7.1f}%")


# Demo
rng     = np.random.default_rng(42)
ret     = rng.normal(0.0003, 0.015, 252)     # daily returns
notional = 10_000_000                         # $10M position
adv_range = np.array([5e6, 10e6, 20e6, 50e6, 100e6])  # daily trading volume

r = lvar_parametric(ret, notional, adv=10e6)
print(f"1-day market VaR:  \${r['1d_market_var']:,.0f}")
print(f"Unwind days:       {r['unwind_days']}")
print(f"L-VaR total:       \${r['total_lvar']:,.0f}")
print(f"Liquidity premium: {r['lvar_premium']*100:.1f}%")
print()
lvar_scaling(ret, notional, adv_range)`,
    explanation:
      "Standard VaR assumes you can exit a position instantly at the mid-price, which breaks down for large positions in illiquid markets. L-VaR adds the liquidation period: if you hold 10% of a stock's daily volume, unwinding takes 10 days, and the VaR must be scaled to the full liquidation horizon. The liquidity premium (L-VaR / VaR - 1) grows quadratically with position size as a fraction of ADV — this is why capacity estimation is a prerequisite for any systematic strategy.",
  },
  {
    id: "pyfin-20260527-b1-convertible-bond",
    language: "python",
    title: "Convertible bond pricing via binomial tree with default",
    tag: "finance",
    code: `import numpy as np

def convertible_bond_binomial(
        S: float, K_conv: float,   # stock price, conversion price
        face: float, coupon: float, # face value, annual coupon rate
        r: float, sigma: float,     # risk-free rate, stock vol
        hazard: float, recovery: float,  # default intensity, recovery rate
        T: float, n_steps: int = 200
) -> dict:
    """
    Binomial tree for convertible bond (Tsiveriotis-Fernandes 1998 approach):
    At each node, compute both equity and debt components separately,
    applying different discount rates (risk-free for equity component,
    risky for debt component).

    Simplified single-tree approach:
    At each node, holder chooses max(conversion_value, hold_value).
    Default: at each step, probability of default = hazard * dt.
    On default: holder receives recovery * face.
    """
    dt     = T / n_steps
    u      = np.exp(sigma * np.sqrt(dt))
    d      = 1.0 / u
    p_u    = (np.exp(r * dt) - d) / (u - d)   # risk-neutral up probability
    p_d    = 1.0 - p_u
    p_def  = hazard * dt                        # default probability per step
    disc   = np.exp(-r * dt)

    # Build terminal stock prices and CB values
    k     = np.arange(n_steps + 1)
    S_T   = S * u**k * d**(n_steps - k)

    # Terminal value: max(conversion, face + coupon payment) or recovery on default
    conv_value = S_T / K_conv * face   # conversion: S/K_conv shares worth S/K_conv * face
    cb_T = np.maximum(conv_value, face * (1 + coupon * dt))

    # Backward induction
    cb = cb_T.copy()
    for step in range(n_steps - 1, -1, -1):
        k_range = np.arange(step + 1)
        S_node  = S * u**k_range * d**(step - k_range)

        # Continuation value (discounted expected future CB value)
        hold_val = disc * (p_u * cb[1:step+2] + p_d * cb[:step+1])

        # Include default: with prob p_def, receive recovery*face
        hold_val = (1 - p_def) * hold_val + p_def * recovery * face

        # Add coupon payment (continuous accrual approximation)
        hold_val += face * coupon * dt * disc

        # Conversion: holder converts if better
        conv_val = S_node / K_conv * face
        cb_new   = np.maximum(hold_val, conv_val)

        # Floor at recovery (put provision, if any, handled by hold_val floor)
        cb = cb_new

    price = cb[0]

    # Greeks via finite difference
    S_up = S * 1.01
    S_dn = S * 0.99
    # Recompute at perturbed spots (expensive, but correct)
    def cb_at_spot(s_0):
        S_T2  = s_0 * u**np.arange(n_steps+1) * d**(n_steps - np.arange(n_steps+1))
        conv2 = S_T2 / K_conv * face
        cb2   = np.maximum(conv2, face * (1 + coupon * dt))
        for step in range(n_steps - 1, -1, -1):
            k2   = np.arange(step + 1)
            S2   = s_0 * u**k2 * d**(step - k2)
            hold = disc * (p_u * cb2[1:step+2] + p_d * cb2[:step+1])
            hold = (1-p_def)*hold + p_def*recovery*face + face*coupon*dt*disc
            cb2  = np.maximum(hold, S2 / K_conv * face)
        return cb2[0]

    delta = (cb_at_spot(S_up) - cb_at_spot(S_dn)) / (2 * S * 0.01)

    return {"price": price, "delta": delta,
            "conversion_pct": S / K_conv * 100,
            "parity": S / K_conv * face}


result = convertible_bond_binomial(
    S=95, K_conv=100, face=1000, coupon=0.03,
    r=0.05, sigma=0.30, hazard=0.02, recovery=0.40,
    T=3.0, n_steps=150
)
print(f"CB price:       {result['price']:.2f}")
print(f"Delta:          {result['delta']:.4f}")
print(f"Conversion pct: {result['conversion_pct']:.1f}%  (parity={result['parity']:.2f})")`,
    explanation:
      "A convertible bond is a hybrid security: when the stock trades well above the conversion price, it behaves like equity (high delta); when the stock falls, it trades like a risky bond (low delta, credit-sensitive). The binomial tree captures the non-linearity by choosing max(hold, convert) at every node. The hazard rate in the discount path makes the credit spread endogenous — as the stock falls, the bond component discounts at a higher spread, compressing the price floor (the 'bond floor' concept central to CB arbitrage).",
  },
  {
    id: "pyfin-20260527-b1-ois-bootstrap",
    language: "python",
    title: "OIS / SOFR curve bootstrap from overnight indexed swap rates",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def ois_bootstrap(maturities: np.ndarray, ois_rates: np.ndarray) -> tuple:
    """
    OIS (Overnight Indexed Swap) curve bootstrap.
    An OIS swap: fixed leg pays at maturity; floating leg pays
    the compounded overnight rate (SOFR in USD, ESTR in EUR).
    For maturity <= 1Y: treated as a single-period deposit.
      df(T) = 1 / (1 + ois_rate * T)  (money-market convention)
    For maturity > 1Y: annual coupon payments (simplified).
      fixed annuity PV = floating notional; bootstrap df(T) iteratively.

    Returns: (discount_factors, zero_rates) arrays matching input maturities.
    """
    dfs  = np.zeros(len(maturities))
    zr   = np.zeros(len(maturities))

    def interp_df(t: float) -> float:
        """Linear interpolation on log-df."""
        if t <= maturities[0]:
            return dfs[0]
        for i in range(1, len(maturities)):
            if maturities[i-1] is not None and t <= maturities[i]:
                if dfs[i-1] <= 0 or dfs[i] <= 0:
                    return np.exp(-zr[i] * t)
                a = (t - maturities[i-1]) / (maturities[i] - maturities[i-1])
                return np.exp((1-a)*np.log(dfs[i-1]) + a*np.log(dfs[i]))
        return dfs[-1]

    for i, (T, s) in enumerate(zip(maturities, ois_rates)):
        if T <= 1.0:
            # Short end: single-period (money-market)
            dfs[i] = 1.0 / (1.0 + s * T)
        else:
            # Long end: annual coupon swap, bootstrap df(T)
            # Fixed annuity = sum_{k=1}^{n-1} s * df(k) + (1+s) * df(T) = 1
            n = int(round(T))
            annuity_known = sum(s * interp_df(float(k)) for k in range(1, n))

            # Solve for df(T): s * sum_known + (1+s) * df(T) = 1
            df_T = (1.0 - s * annuity_known) / (1.0 + s)
            dfs[i] = max(df_T, 1e-8)

        zr[i] = -np.log(dfs[i]) / T if T > 0 else s

    return dfs, zr


# Current-style SOFR OIS rates (hypothetical)
maturities = np.array([1/12, 3/12, 6/12, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0])
ois_rates  = np.array([0.052, 0.053, 0.054, 0.054, 0.052, 0.051, 0.049, 0.048, 0.048])

dfs, zero_rates = ois_bootstrap(maturities, ois_rates)

print(f"{'Maturity':>10}  {'OIS Rate':>9}  {'DF':>8}  {'Zero Rate':>10}")
for T, ois, df, zr in zip(maturities, ois_rates, dfs, zero_rates):
    print(f"{T:10.4f}  {ois*100:8.3f}%  {df:.6f}  {zr*100:9.4f}%")

# Forward SOFR rate between 1Y and 2Y (swap market forward)
fwd_1y2y = (dfs[3] / dfs[4] - 1.0)   # annual forward rate
print(f"\\nForward SOFR 1Yx1Y: {fwd_1y2y*100:.3f}%")`,
    explanation:
      "Post-LIBOR reform, OIS (SOFR, ESTR, SONIA) curves have replaced LIBOR as the primary risk-free rate for discounting. The bootstrap is structurally identical to LIBOR swap curve construction, but with daily compounding on the floating leg rather than 3M LIBOR resets. For overnight-accruing instruments, the money-market convention (1/(1+r×T)) applies up to 1Y; beyond 1Y, annual coupon fixed-leg conventions apply. The resulting discount factors are used to price all CSA-collateralised derivatives.",
  },
  {
    id: "pyfin-20260527-b1-tsmom",
    language: "python",
    title: "Time-series momentum (TSMOM) with lookback selection",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.stats import spearmanr

def tsmom_signal(prices: pd.Series, lookback: int = 12,
                  vol_scale: bool = True, vol_window: int = 63) -> pd.Series:
    """
    Moskowitz-Ooi-Pedersen (2012) TSMOM: go long if past-12M return > 0, short if < 0.
    The signal is scaled by realised volatility to target constant risk across assets.
    Vol-scaled position: sign(r_past) / sigma_ewm  (standardised by realized vol).
    Key property: TSMOM is profitable across all asset classes (MOP 2012 finding).
    """
    past_ret  = prices.pct_change(lookback * 21)   # approximate lookback*month returns
    signal    = np.sign(past_ret)                   # +1 or -1

    if vol_scale:
        daily_ret = prices.pct_change()
        ewm_vol   = daily_ret.ewm(span=vol_window, adjust=False).std() * np.sqrt(252)
        signal    = signal / (ewm_vol + 1e-8)       # risk-scaled

    return signal


def tsmom_backtest(prices_df: pd.DataFrame,
                    lookback: int = 12,
                    target_vol: float = 0.10,
                    cost_bps: float = 5.0) -> pd.DataFrame:
    """
    Full portfolio TSMOM backtest:
    1. Compute vol-scaled signal for each asset.
    2. Scale portfolio to target annual vol.
    3. Apply transaction costs on position changes.
    4. Compute portfolio returns and risk metrics.
    """
    signals = pd.DataFrame(index=prices_df.index)
    for col in prices_df.columns:
        signals[col] = tsmom_signal(prices_df[col], lookback)

    # Daily returns for each asset
    ret_df   = prices_df.pct_change()
    # Position (scaled to target_vol per asset, equal weight across assets)
    port_vol = 0.20  # assumed average single-asset vol
    pos      = signals.shift(1) * target_vol / (port_vol * len(prices_df.columns))

    # Gross returns
    gross_ret = (pos * ret_df).sum(axis=1)

    # Transaction costs: cost_bps on |position change|
    position_change = pos.diff().abs().sum(axis=1)
    costs = position_change * (cost_bps / 10000.0)

    net_ret = gross_ret - costs

    # Summary statistics
    ann_ret  = net_ret.mean() * 252
    ann_vol  = net_ret.std() * np.sqrt(252)
    sharpe   = ann_ret / ann_vol if ann_vol > 0 else 0.0
    max_dd   = (net_ret.cumsum() - net_ret.cumsum().cummax()).min()

    return pd.DataFrame({
        "gross_return": gross_ret,
        "net_return":   net_ret,
        "cumulative":   net_ret.cumsum(),
    }), {"sharpe": sharpe, "ann_ret": ann_ret, "ann_vol": ann_vol, "max_dd": max_dd}


# Simulate 3 momentum-friendly assets
rng = np.random.default_rng(42)
T   = 252 * 5
dates = pd.date_range("2019-01-01", periods=T, freq="B")

# Trending assets with regime changes
prices = {}
for i, name in enumerate(["Asset_A", "Asset_B", "Asset_C"]):
    trend = np.sin(np.linspace(0, 2*np.pi, T) * 2) * 0.0003   # slow trend cycle
    ret   = trend + rng.normal(0, 0.015, T)
    prices[name] = pd.Series(100 * np.exp(np.cumsum(ret)), index=dates)

prices_df = pd.DataFrame(prices)
result_df, stats = tsmom_backtest(prices_df, lookback=12)

print(f"Sharpe:  {stats['sharpe']:.2f}")
print(f"Ann Ret: {stats['ann_ret']*100:.2f}%")
print(f"Ann Vol: {stats['ann_vol']*100:.2f}%")
print(f"Max DD:  {stats['max_dd']*100:.2f}%")`,
    explanation:
      "Time-series momentum differs from cross-sectional momentum: TSMOM asks 'did this asset go up or down over the past year?' rather than 'which assets went up the most?'. The vol-scaled version targets equal risk contribution per asset regardless of market volatility. MOP (2012) showed that TSMOM is profitable across 58 asset classes including commodities, bonds, and FX — a finding that can't be explained by market microstructure. The flip risk is that TSMOM crashes during sharp trend reversals (2009, 2020 V-shaped recovery).",
  },
  {
    id: "pyfin-20260527-b1-vanna-volga",
    language: "python",
    title: "Vanna-Volga FX option pricing — smile interpolation via Greeks",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def black_scholes(F, K, sigma, T, r, kind="call"):
    """BS price for a forward F, strike K, vol sigma, maturity T."""
    d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    df = np.exp(-r*T)
    if kind == "call":
        return df * (F*norm.cdf(d1) - K*norm.cdf(d2))
    return df * (K*norm.cdf(-d2) - F*norm.cdf(-d1))


def vanna(F, K, sigma, T, r):
    """d^2 C / (dS * d sigma): vanna = dDelta/dVol."""
    d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return -np.exp(-r*T) * norm.pdf(d1) * d2 / sigma


def volga(F, K, sigma, T, r):
    """d^2 C / d sigma^2: volga (vomma) = dVega/dVol."""
    d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return F * np.exp(-r*T) * norm.pdf(d1) * np.sqrt(T) * d1 * d2 / sigma


def vanna_volga_price(F: float, K: float, r: float, T: float,
                       sigma_atm: float,        # ATM implied vol
                       sigma_25rr: float,        # 25-delta risk reversal (call_vol - put_vol)
                       sigma_25bf: float         # 25-delta butterfly (avg wings - ATM)
) -> dict:
    """
    Vanna-Volga (Castagna-Mercurio 2007): 3-instrument replication.
    Pillar strikes: K_25P (25-delta put), K_ATM, K_25C (25-delta call).
    Three pillars define unique deltas, so we can hedge vega, vanna, volga simultaneously.
    VV-adjusted price = BS(sigma_atm) + x1*(mktP1 - BSP1) + x2*(mktP2 - BSP2) + x3*(mktP3-BSP3)

    Simplified two-pillar VV for illustration (pillar = RR and BF).
    """
    # Pillar vols: ATM, 25-delta call, 25-delta put
    sigma_25c = sigma_atm + 0.5 * sigma_25rr + sigma_25bf
    sigma_25p = sigma_atm - 0.5 * sigma_25rr + sigma_25bf

    # Pillar strikes (approximate via BS delta inversion for simplicity)
    sqrt_T   = np.sqrt(T)
    K_25c    = F * np.exp(sigma_25c**2*T*0.5 + sigma_25c*sqrt_T*norm.ppf(0.75))
    K_25p    = F * np.exp(sigma_25p**2*T*0.5 + sigma_25p*sqrt_T*norm.ppf(0.25))

    # BS prices and market prices at pillars
    bs_atm   = black_scholes(F, F,     sigma_atm, T, r)
    bs_25c   = black_scholes(F, K_25c, sigma_atm, T, r)
    bs_25p   = black_scholes(F, K_25p, sigma_atm, T, r, kind="put")

    mkt_atm  = black_scholes(F, F,     sigma_atm, T, r)   # ATM smile = flat here
    mkt_25c  = black_scholes(F, K_25c, sigma_25c, T, r)
    mkt_25p  = black_scholes(F, K_25p, sigma_25p, T, r, kind="put")

    # Vanna and volga of the target option
    vga_K    = vanna(F, K, sigma_atm, T, r)
    vlg_K    = volga(F, K, sigma_atm, T, r)

    # Hedging ratios (approximate single-pillar for brevity)
    vga_c  = vanna(F, K_25c, sigma_atm, T, r)
    vlg_c  = volga(F, K_25c, sigma_atm, T, r)

    x_rr   = vga_K / (vga_c + 1e-14)
    x_bf   = vlg_K / (vlg_c + 1e-14)

    bs_K    = black_scholes(F, K, sigma_atm, T, r)
    vv_price = bs_K + x_rr*(mkt_25c - bs_25c) + x_bf*(mkt_25p - bs_25p)

    return {
        "bs_price":  bs_K,
        "vv_price":  vv_price,
        "impl_vol":  sigma_atm,  # full inversion omitted for brevity
        "K_25c":     K_25c,
        "K_25p":     K_25p,
    }


# EUR/USD: 6M ATM=7%, 25RR=-0.5% (put skew), 25BF=0.3%
result = vanna_volga_price(F=1.0800, K=1.1000, r=0.03, T=0.5,
                            sigma_atm=0.07, sigma_25rr=-0.005, sigma_25bf=0.003)
print(f"BS price  (flat smile): {result['bs_price']:.6f}")
print(f"VV price  (smile adj):  {result['vv_price']:.6f}")
print(f"25-delta call strike:   {result['K_25c']:.4f}")
print(f"25-delta put  strike:   {result['K_25p']:.4f}")`,
    explanation:
      "Vanna-Volga pricing is the FX dealer's standard method for pricing exotic options off the vanilla smile: it constructs a portfolio of three liquid vanillas (25-delta put, ATM, 25-delta call) that matches the exotic's vanna and volga exposures, then prices the exotic as BS plus the smile premium of the hedge portfolio. VV is remarkably accurate for one-touch options and barrier options where vanna and volga dominate the smile P&L. The FX volatility market is uniquely quoted in delta space (ATM, 25RR, 25BF, 10RR, 10BF) rather than strike space.",
  },
  {
    id: "pyfin-20260527-b1-concentration",
    language: "python",
    title: "Portfolio concentration metrics — HHI, Gini coefficient, entropy",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def herfindahl_hirschman_index(weights: np.ndarray) -> float:
    """
    HHI = sum(w_i^2).  Range: [1/N, 1].
    1/N = perfectly diversified; 1 = single asset.
    Normalised HHI = (HHI - 1/N) / (1 - 1/N): maps to [0, 1].
    """
    w = np.abs(weights) / np.abs(weights).sum()   # normalise long-only
    return float(np.sum(w**2))


def effective_n(weights: np.ndarray) -> float:
    """
    Effective number of bets = 1 / HHI.
    Intuition: equivalent to a uniform portfolio with effective_n assets.
    """
    return 1.0 / herfindahl_hirschman_index(weights)


def portfolio_entropy(weights: np.ndarray) -> float:
    """
    Shannon entropy: H = -sum(w_i * log(w_i)).
    Max entropy = log(N) (equal weights).  Higher = more diversified.
    """
    w = np.abs(weights) / np.abs(weights).sum()
    w = w[w > 0]
    return float(-np.sum(w * np.log(w)))


def normalised_entropy(weights: np.ndarray) -> float:
    """Entropy normalised to [0, 1]: 1 = equal weights, 0 = single asset."""
    n = len(weights)
    h = portfolio_entropy(weights)
    return h / np.log(n) if n > 1 else 0.0


def gini_coefficient(weights: np.ndarray) -> float:
    """
    Gini coefficient: measures inequality of weight distribution.
    0 = perfectly equal; 1 = all weight in one asset.
    Gini = (sum_i sum_j |w_i - w_j|) / (2 * N * sum_i w_i)
    O(N^2) but fast for typical portfolio sizes.
    """
    w = np.abs(weights) / np.abs(weights).sum()
    n = len(w)
    w_sorted = np.sort(w)
    index    = np.arange(1, n + 1)
    return float((2 * np.sum(index * w_sorted) - (n + 1) * np.sum(w_sorted))
                 / (n * np.sum(w_sorted)))


def diversification_report(weights: np.ndarray, names: list[str] = None) -> pd.DataFrame:
    """Full concentration diagnostic for a portfolio."""
    w = np.abs(weights) / np.abs(weights).sum()
    n = len(w)
    df = pd.DataFrame({
        "Metric":    ["N assets", "HHI", "Effective N", "Entropy (bits)",
                      "Normalised Entropy", "Gini Coeff",
                      "Max weight", "Top-5 weight"],
        "Value":     [n,
                      herfindahl_hirschman_index(w),
                      effective_n(w),
                      portfolio_entropy(w),
                      normalised_entropy(w),
                      gini_coefficient(w),
                      w.max(),
                      np.sort(w)[::-1][:5].sum()],
    })
    return df


# Compare three portfolios
rng = np.random.default_rng(42)
N   = 50

w_equal    = np.ones(N) / N                               # fully equal
w_random   = np.abs(rng.dirichlet(np.ones(N)))             # random Dirichlet
w_skewed   = rng.dirichlet(np.array([50] + [1]*(N-1)))    # 1 dominant asset

print("=== Equal Weights ===")
print(diversification_report(w_equal).to_string(index=False))
print("\\n=== Skewed Weights ===")
print(diversification_report(w_skewed).to_string(index=False))

# Track concentration over time (rolling rebalancing)
dates = pd.date_range("2023-01-01", periods=252, freq="B")
daily_hhi  = pd.Series([herfindahl_hirschman_index(
                 np.abs(rng.dirichlet(np.ones(N)))) for _ in dates], index=dates)
print(f"\\nMedian daily HHI: {daily_hhi.median():.4f}  (1/{N}={1/N:.4f} is fully equal)")`,
    explanation:
      "HHI, entropy, and Gini measure portfolio concentration from three complementary angles: HHI focuses on large weights (squares amplify big positions), entropy is a more gradual measure of spread, and Gini captures overall inequality in the weight distribution. Regulators and risk managers use HHI as a hard concentration limit; fund of fund allocators use effective N to assess how many truly independent bets a manager is making. A portfolio with effective N = 3 has the same concentration as a 3-asset equal-weight portfolio, regardless of the number of underlying positions.",
  },
  {
    id: "pyfin-20260527-b1-bayesian-alpha",
    language: "python",
    title: "Bayesian alpha signal updating — normal-normal conjugate model",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from dataclasses import dataclass, field

@dataclass
class AlphaState:
    """
    Bayesian state for a signal alpha under the conjugate normal-normal model:
    Prior:       alpha ~ N(mu0, tau0^2)
    Likelihood:  r_t = alpha * s_t + eps_t,  eps ~ N(0, sigma^2)
    Posterior:   alpha | data ~ N(mu_n, tau_n^2)
    This represents evolving confidence in the alpha as new observations arrive.
    """
    mu0:    float         # prior mean of alpha (e.g., from historical IC)
    tau0:   float         # prior std of alpha
    sigma:  float         # observation noise (conditional on signal)
    mu:     float = field(init=False)
    tau:    float = field(init=False)

    def __post_init__(self):
        self.mu  = self.mu0
        self.tau = self.tau0

    def update(self, signal: float, realized_return: float) -> None:
        """
        Bayesian update given (signal, realized_return) pair.
        Effective observation: r / s ~ N(alpha, sigma^2 / s^2).
        Posterior update:
          precision_n = precision_prior + s^2 / sigma^2
          mu_n        = (mu_prior * precision_prior + r * s / sigma^2) / precision_n
        """
        if abs(signal) < 1e-8:
            return   # zero signal: no information
        # Implied alpha estimate from this observation
        obs_alpha   = realized_return / signal          # single observation of alpha
        obs_prec    = signal**2 / (self.sigma**2)       # observation precision

        prior_prec  = 1.0 / self.tau**2
        post_prec   = prior_prec + obs_prec
        self.mu     = (prior_prec * self.mu + obs_prec * obs_alpha) / post_prec
        self.tau    = 1.0 / np.sqrt(post_prec)

    def shrinkage_weight(self) -> float:
        """
        Posterior weight on observations vs prior (James-Stein shrinkage).
        When tau is large (uncertain), weight on observations is small.
        """
        return (1.0 / self.tau**2) / (1.0 / self.tau0**2 + 1.0 / self.tau**2)

    def credible_interval(self, alpha_level: float = 0.05) -> tuple:
        from scipy.stats import norm
        z = norm.ppf(1.0 - alpha_level / 2.0)
        return (self.mu - z * self.tau, self.mu + z * self.tau)


def simulate_alpha_learning(true_alpha: float, n_obs: int = 200,
                              prior_mu: float = 0.0, prior_tau: float = 0.05,
                              sigma: float = 0.02, seed: int = 42) -> pd.DataFrame:
    """Simulate the Bayesian learning of alpha over time."""
    rng     = np.random.default_rng(seed)
    state   = AlphaState(mu0=prior_mu, tau0=prior_tau, sigma=sigma)

    history = []
    for t in range(n_obs):
        signal = rng.standard_normal()          # normalised signal
        ret    = true_alpha * signal + rng.normal(0, sigma)

        ci_lo, ci_hi = state.credible_interval()
        history.append({
            "t": t, "mu": state.mu, "tau": state.tau,
            "ci_lo": ci_lo, "ci_hi": ci_hi,
            "contains_true": ci_lo <= true_alpha <= ci_hi,
            "shrinkage": state.shrinkage_weight(),
        })
        state.update(signal, ret)

    return pd.DataFrame(history)


# True alpha = 3% (e.g., 3% IC), prior belief = 0%
true_alpha = 0.03
hist = simulate_alpha_learning(true_alpha, n_obs=300, prior_mu=0.0, prior_tau=0.05)

print(f"True alpha: {true_alpha:.4f}")
print(f"\\nAfter   10 obs: mu={hist.iloc[9]['mu']:.4f}  tau={hist.iloc[9]['tau']:.4f}")
print(f"After   50 obs: mu={hist.iloc[49]['mu']:.4f}  tau={hist.iloc[49]['tau']:.4f}")
print(f"After  200 obs: mu={hist.iloc[199]['mu']:.4f}  tau={hist.iloc[199]['tau']:.4f}")
print(f"\\nCI coverage (should be ~95%): {hist['contains_true'].mean()*100:.1f}%")
print(f"Shrinkage at 200 obs: {hist.iloc[199]['shrinkage']:.3f}")`,
    explanation:
      "Bayesian alpha updating formalises the signal discovery process: with few observations, the posterior stays close to the prior (zero alpha); as evidence accumulates, the posterior shifts toward the true alpha. The shrinkage weight shows how much weight the model places on the data vs the prior — at 200 observations with reasonable signal quality (IC ≈ 0.03), the posterior weight on observations is still below 80%, meaning James-Stein-style regularisation is still active. This prevents overfitting to a short backtest window.",
  },
  {
    id: "pyfin-20260527-b1-mbs-prepay",
    language: "python",
    title: "MBS prepayment model — PSA convention and price sensitivity",
    tag: "finance",
    code: `import numpy as np

def psa_smm(month: int, psa_speed: float = 1.0) -> float:
    """
    PSA (Public Securities Association) prepayment benchmark:
    CPR (Conditional Prepayment Rate) ramps linearly from 0% at month 1
    to 6% by month 30, then stays flat at 6%.
    100% PSA = standard speed; 150% PSA = 1.5x faster prepayment.
    SMM (Single Monthly Mortality) = 1 - (1 - CPR)^(1/12).
    """
    cpr = min(0.06 * month / 30.0, 0.06) * psa_speed
    return 1.0 - (1.0 - cpr) ** (1.0 / 12.0)


def mbs_cashflows(balance: float, coupon: float, wam: int,
                   psa_speed: float = 1.0) -> np.ndarray:
    """
    Compute monthly cash flows for a pass-through MBS.
    balance:  original face value
    coupon:   gross coupon rate (annual)
    wam:      weighted average maturity (months)
    Returns array of shape (wam, 4): [month, interest, scheduled_principal, prepayment]
    """
    r_monthly = coupon / 12.0
    remaining = balance
    flows     = []

    for t in range(1, wam + 1):
        if remaining <= 0:
            break
        # Scheduled payment (standard mortgage formula)
        pmt = remaining * r_monthly / (1.0 - (1.0 + r_monthly) ** -(wam - t + 1))
        interest = remaining * r_monthly
        sched_princ = pmt - interest

        # Prepayment
        smm    = psa_smm(t, psa_speed)
        prepay = smm * (remaining - sched_princ)

        total_princ = sched_princ + prepay
        flows.append([t, interest, sched_princ, prepay])
        remaining -= total_princ

    return np.array(flows)


def mbs_price(balance: float, coupon: float, wam: int, discount_rate: float,
               psa_speed: float = 1.0) -> float:
    """Price of an MBS as PV of projected cash flows at psa_speed."""
    flows = mbs_cashflows(balance, coupon, wam, psa_speed)
    r_monthly = discount_rate / 12.0
    pv = 0.0
    for t, interest, sched, prepay in flows:
        total_cf = interest + sched + prepay
        pv += total_cf / (1.0 + r_monthly) ** t
    return pv / balance * 100.0   # price per $100 face


def mbs_oas(balance: float, coupon: float, wam: int,
             market_price: float, benchmark_rate: float,
             psa_speed: float = 1.0, tol: float = 1e-6) -> float:
    """
    Option-adjusted spread: solve for OAS such that
    PV(cash flows discounted at benchmark + OAS) = market_price.
    This is a simple flat-spread OAS (no explicit option model here).
    """
    from scipy.optimize import brentq
    def price_diff(oas):
        return mbs_price(balance, coupon, wam, benchmark_rate + oas, psa_speed) - market_price
    # Search for OAS in [-500bps, +500bps]
    if price_diff(-0.05) * price_diff(0.05) > 0:
        return np.nan
    return brentq(price_diff, -0.05, 0.05, xtol=tol)


# 30-year 6% MBS at 100% PSA vs 200% PSA (faster prepayment)
balance = 1_000_000
coupon  = 0.06
wam     = 360      # 30 years

for psa in [50, 100, 150, 200, 300]:
    price = mbs_price(balance, coupon, wam, discount_rate=0.055, psa_speed=psa/100)
    print(f"PSA {psa:3d}%: price={price:.3f}")

# OAS for 100% PSA MBS trading at 99.50
oas = mbs_oas(balance, coupon, wam, market_price=99.50, benchmark_rate=0.055)
print(f"\\nOAS (100% PSA, price=99.50): {oas*10000:.1f} bps")`,
    explanation:
      "The PSA prepayment model is the industry standard for MBS analytics: it assumes borrowers refinance faster in rising markets (negative convexity) and slower in falling markets, making MBS price sensitivity asymmetric. Faster PSA speeds shorten the effective duration (the MBS is paid off sooner) and reduce price relative to a comparable bond. The Option-Adjusted Spread strips out the prepayment option cost, giving a credit-like spread for comparison across differently-structured MBS collateral.",
  },
  {
    id: "pyfin-20260527-b1-ms-garch",
    language: "python",
    title: "Markov Switching GARCH — regime-dependent volatility",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.special import logsumexp

def ms_garch_filter(returns: np.ndarray, params: np.ndarray) -> dict:
    """
    2-state Markov Switching GARCH (Haas-Mittnik-Paolella 2004):
    State 1 (low-vol): omega1, alpha1, beta1, persistence1
    State 2 (high-vol): omega2, alpha2, beta2, persistence2
    Transition matrix: P = [[p11, 1-p11], [1-p22, p22]]

    At each time t, filter the probability of being in each regime
    via Hamilton (1989) filter + GARCH variance recursion per state.
    """
    n      = len(returns)
    omega1, alpha1, beta1, omega2, alpha2, beta2, p11, p22 = params

    # Validate
    for v in [omega1, alpha1, beta1, omega2, alpha2, beta2]:
        if v <= 0: return {"loglik": -1e10}
    if p11 <= 0 or p11 >= 1 or p22 <= 0 or p22 >= 1:
        return {"loglik": -1e10}
    if alpha1 + beta1 >= 1 or alpha2 + beta2 >= 1:
        return {"loglik": -1e10}

    P = np.array([[p11, 1-p22], [1-p11, p22]])  # transition matrix

    # Unconditional state probs as starting point
    pi = np.array([(1-p22) / (2 - p11 - p22), (1-p11) / (2 - p11 - p22)])

    h1   = omega1 / (1 - alpha1 - beta1)   # unconditional var state 1
    h2   = omega2 / (1 - alpha2 - beta2)   # unconditional var state 2
    eps2 = returns[0]**2

    log_lik  = 0.0
    probs    = np.zeros((n, 2))  # filtered regime probabilities

    for t in range(n):
        r = returns[t]
        # Conditional density in each state
        pdf1 = np.exp(-0.5 * r**2 / h1) / np.sqrt(2*np.pi*h1)
        pdf2 = np.exp(-0.5 * r**2 / h2) / np.sqrt(2*np.pi*h2)

        # Joint probability of state and observation
        joint = pi * np.array([pdf1, pdf2])
        total = joint.sum()
        if total < 1e-300:
            break

        log_lik     += np.log(total)
        filtered     = joint / total
        probs[t]     = filtered

        # Predict next period's state probability
        pi   = P.T @ filtered

        # Update GARCH variance
        eps2 = r**2
        h1   = omega1 + alpha1 * eps2 + beta1 * h1
        h2   = omega2 + alpha2 * eps2 + beta2 * h2

    return {"loglik": log_lik, "state_probs": probs}


def fit_ms_garch(returns: np.ndarray, n_restarts: int = 5, seed: int = 42) -> dict:
    """Fit 2-state MS-GARCH by maximum likelihood."""
    rng = np.random.default_rng(seed)
    best_ll, best_params = -np.inf, None

    for _ in range(n_restarts):
        # Random initialisation
        x0 = np.array([
            rng.uniform(1e-6, 1e-4),   # omega1
            rng.uniform(0.02,  0.15),  # alpha1
            rng.uniform(0.70,  0.90),  # beta1
            rng.uniform(1e-5, 1e-3),   # omega2 (higher vol state)
            rng.uniform(0.05,  0.20),  # alpha2
            rng.uniform(0.60,  0.85),  # beta2
            rng.uniform(0.90,  0.99),  # p11 (stay in low-vol state)
            rng.uniform(0.80,  0.95),  # p22 (stay in high-vol state)
        ])

        def neg_ll(params):
            res = ms_garch_filter(returns, params)
            return -res["loglik"]

        try:
            opt = minimize(neg_ll, x0, method="Nelder-Mead",
                           options={"maxiter": 2000, "xatol": 1e-6, "fatol": 1e-6})
            if -opt.fun > best_ll:
                best_ll     = -opt.fun
                best_params = opt.x
        except Exception:
            continue

    return {"params": best_params, "loglik": best_ll}


# Demo on simulated returns with regime switching
rng = np.random.default_rng(42)
T   = 1000
state = np.zeros(T, dtype=int)
ret   = np.zeros(T)
vol   = [0.008, 0.025]   # low-vol and high-vol regimes
for t in range(1, T):
    state[t] = 0 if (rng.random() < (0.97 if state[t-1]==0 else 0.05)) else 1
    ret[t]   = rng.normal(0, vol[state[t]])

result = ms_garch_filter(ret, [2e-5, 0.05, 0.90, 1e-4, 0.10, 0.80, 0.95, 0.85])
p_high_vol = result["state_probs"][:, 1]
print(f"Avg P(high-vol state): {p_high_vol.mean():.3f}")
print(f"Max P(high-vol):       {p_high_vol.max():.3f}")
print(f"Pct time high-vol:     {(state==1).mean()*100:.1f}%  (actual)")`,
    explanation:
      "Markov Switching GARCH combines the regime-switching Markov model with GARCH volatility dynamics within each regime. Unlike simple GARCH, it can capture abrupt volatility jumps (crisis onsets) that a single-regime GARCH model smooths over with slow alpha+beta convergence. The Hamilton filter computes the filtered regime probability at each time step: in a crisis (2008, 2020 COVID), P(high-vol state) spikes above 0.9, allowing the risk system to dynamically adjust VaR limits and position sizes.",
  },
  {
    id: "pyfin-20260527-b1-static-replication",
    language: "python",
    title: "Static replication of barrier option via vanilla call spread",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import minimize

def bs_call(S, K, r, sigma, T):
    if sigma <= 0 or T <= 0: return max(S - K, 0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, r, sigma, T):
    c = bs_call(S, K, r, sigma, T)
    return c - S + K*np.exp(-r*T)

def up_and_out_call_analytic(S, K, H, r, sigma, T) -> float:
    """
    Closed-form U&O call: Merton (1973) / Rubinstein-Reiner (1991).
    Valid for continuous monitoring.
    """
    if H <= K: return 0.0
    lam = (r + 0.5*sigma**2) / sigma**2
    x1  = np.log(S/K)  / (sigma*np.sqrt(T)) + lam*sigma*np.sqrt(T)
    x2  = np.log(S/H)  / (sigma*np.sqrt(T)) + lam*sigma*np.sqrt(T)
    y1  = np.log(H**2/(S*K)) / (sigma*np.sqrt(T)) + lam*sigma*np.sqrt(T)
    y2  = np.log(H/S)  / (sigma*np.sqrt(T)) + lam*sigma*np.sqrt(T)
    df  = np.exp(-r*T)

    val  = (S*norm.cdf(x1) - K*df*norm.cdf(x1 - sigma*np.sqrt(T))
          - S*(H/S)**(2*lam)*(norm.cdf(-y1) - norm.cdf(-y2))
          + K*df*(H/S)**(2*lam-2)*(norm.cdf(-y1+sigma*np.sqrt(T))-norm.cdf(-y2+sigma*np.sqrt(T))))
    return max(val, 0.0)


def static_replicate_barrier(S: float, K: float, H: float,
                               r: float, sigma: float, T: float,
                               n_strikes: int = 20) -> dict:
    """
    Static replication (Derman-Ergener-Kani 1995):
    Represent an up-and-out call as a portfolio of vanilla calls with
    strikes distributed along [K, H] — payoff is zero at the barrier.
    The replication portfolio holds the barrier option's value without delta-hedging,
    by matching the boundary condition at S = H for all t.

    Here: approximate with a linear combination of OTM calls.
    Find weights w such that sum(w * call(H, K_i, ...)) = 0 (barrier condition).
    """
    strikes_repl = np.linspace(K, H, n_strikes + 1)[1:]   # strikes between K and H

    # Exact barrier price
    target_price = up_and_out_call_analytic(S, K, H, r, sigma, T)

    # At S = H: the replication portfolio must have zero value (knocked out)
    barrier_values = np.array([bs_call(H, ki, r, sigma, T) for ki in strikes_repl])

    # Also match price at S (fair value condition)
    current_values = np.array([bs_call(S, ki, r, sigma, T) for ki in strikes_repl])

    # Simple 2-constraint least-squares: minimise sum(w^2) s.t. boundary conditions
    def obj(w): return np.sum(w**2)

    constraints = [
        {"type": "eq", "fun": lambda w: np.dot(w, barrier_values)},            # zero at barrier
        {"type": "eq", "fun": lambda w: np.dot(w, current_values) - target_price},  # match price
    ]
    w0  = np.ones(n_strikes) / n_strikes
    res = minimize(obj, w0, method="SLSQP", constraints=constraints,
                   options={"ftol": 1e-10, "maxiter": 1000})

    replicated = np.dot(res.x, current_values)

    return {
        "analytic_price": target_price,
        "replicated_price": replicated,
        "weights": res.x,
        "strikes": strikes_repl,
        "barrier_residual": abs(np.dot(res.x, barrier_values)),
    }


S, K, H  = 100, 100, 120
r, sigma, T = 0.05, 0.20, 1.0

analytic = up_and_out_call_analytic(S, K, H, r, sigma, T)
rep      = static_replicate_barrier(S, K, H, r, sigma, T, n_strikes=10)

print(f"Analytic U&O price:    {analytic:.4f}")
print(f"Static replication:    {rep['replicated_price']:.4f}")
print(f"Barrier residual:      {rep['barrier_residual']:.6f}")
print(f"Replication weights:   {np.round(rep['weights'], 4)}")`,
    explanation:
      "Static replication constructs a vanilla portfolio that exactly mimics a barrier option payoff without any subsequent delta-hedging. The boundary condition 'portfolio value = 0 at S = H' pins the replicating weights, while the fair-value condition fixes the initial price. Once established, the portfolio requires no rebalancing until the barrier is breached — dramatically lower transaction costs than dynamic delta-hedging. The DEK approach generalises to path-dependent and multi-asset barriers by matching boundary conditions on a grid.",
  },
  {
    id: "pyfin-20260527-b1-cat-bond",
    language: "python",
    title: "CAT bond pricing — Poisson catastrophe loss model",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import poisson

def cat_bond_price(face: float, coupon: float, maturity: float,
                    r_spread: float,       # risk-free spread above risk-free rate
                    lam: float,            # annual event arrival rate (Poisson)
                    loss_given_event: float,  # fraction of face lost per event
                    rf: float = 0.05,      # risk-free rate
                    n_steps: int = 100,
                    recovery: float = 0.0) -> dict:
    """
    Catastrophe (CAT) bond: fixed coupon + principal, but principal is reduced
    (or lost) if a catastrophe event occurs during the bond's life.
    Model: events arrive as Poisson(lambda * T); each event reduces principal
    by loss_given_event * face.  Coupons accrue on the reduced notional.

    Pricing: sum over possible number of events k (Poisson PMF) of PV(cash flows | k events).
    """
    dt     = maturity / n_steps
    disc_r = rf + r_spread   # discount at risk-free + investor-required spread

    # Maximum losses (floor at 0)
    max_events = min(int(lam * maturity * 5 + 20), 100)   # truncate tail

    # Expected PV via Poisson mixture
    pv_total = 0.0
    for k in range(max_events + 1):
        pk = poisson.pmf(k, lam * maturity)   # probability of k events
        if pk < 1e-12: break

        # Principal after k events
        remaining_principal = max(face * (1.0 - k * loss_given_event), recovery * face)

        # PV of coupon stream (simplified: flat remaining principal)
        coupon_pv = 0.0
        for step in range(1, n_steps + 1):
            t  = step * dt
            # Assume events uniformly distributed over [0, T];
            # on average k*t/T events by time t -> remaining notional
            n_by_t   = k * t / maturity
            notional_t = max(face * (1.0 - n_by_t * loss_given_event), recovery * face)
            coupon_pv += notional_t * coupon * dt * np.exp(-disc_r * t)

        principal_pv = remaining_principal * np.exp(-disc_r * maturity)
        pv_total    += pk * (coupon_pv + principal_pv)

    # Expected loss (EL) for pricing
    el = sum(
        poisson.pmf(k, lam * maturity) * min(k * loss_given_event, 1.0) * face
        for k in range(max_events + 1)
    )

    return {
        "price":           pv_total,
        "price_pct_face":  pv_total / face * 100.0,
        "expected_loss":   el,
        "el_pct":          el / face * 100.0,
        "annual_el_bps":   el / face / maturity * 10000,
    }


# 3Y CAT bond: 8% coupon, 1 hurricane/year, 50% loss per event
for lam in [0.1, 0.5, 1.0, 2.0]:
    res = cat_bond_price(face=1000, coupon=0.08, maturity=3.0,
                          r_spread=0.03, lam=lam,
                          loss_given_event=0.50, rf=0.05)
    print(f"lambda={lam:.1f}  price={res['price_pct_face']:.2f}  "
          f"EL={res['el_pct']:.2f}%  Ann_EL={res['annual_el_bps']:.0f}bps")

# Sensitivity to loss severity
print("\\nSensitivity to loss severity (lambda=0.5):")
for lgd in [0.20, 0.30, 0.50, 0.75, 1.00]:
    res = cat_bond_price(1000, 0.08, 3.0, 0.03, 0.5, lgd, 0.05)
    print(f"  LGD={lgd:.0%}  price={res['price_pct_face']:.2f}  EL={res['el_pct']:.2f}%")`,
    explanation:
      "CAT bonds transfer catastrophe risk (hurricanes, earthquakes, pandemics) from insurance companies to capital markets investors who earn a spread above risk-free in exchange for bearing tail risk. The Poisson arrival model is the simplest parametrisation: annual event rate λ from historical catastrophe data, loss severity from actuarial models. The expected loss (EL) is the main pricing input; the spread above EL compensates for volatility, correlation with market downturns (2020 COVID was both a financial and catastrophe event), and illiquidity.",
  },
  {
    id: "pyfin-20260527-b1-hw2f",
    language: "python",
    title: "Hull-White 2-factor model — simulation and caplet pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def hw2f_simulate(a1: float, sigma1: float,
                   a2: float, sigma2: float,
                   rho: float, r0: float,
                   T: float, n_paths: int = 10000,
                   n_steps: int = 100, seed: int = 42) -> np.ndarray:
    """
    Hull-White 2-factor: r(t) = x(t) + y(t) + phi(t)
    dx = -a1*x dt + sigma1*dW1
    dy = -a2*y dt + sigma2*dW2,  corr(dW1,dW2) = rho
    phi(t) = deterministic shift to fit initial term structure (set to r0 for flat curve).

    Returns terminal short rates r(T) for all paths.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    L   = np.array([[1.0, 0.0], [rho, np.sqrt(1.0 - rho**2)]])

    x = np.zeros(n_paths)
    y = np.zeros(n_paths)

    for _ in range(n_steps):
        z    = rng.standard_normal((2, n_paths))
        dW   = L @ z * np.sqrt(dt)
        x   += -a1 * x * dt + sigma1 * dW[0]
        y   += -a2 * y * dt + sigma2 * dW[1]

    phi_T = r0    # flat initial curve
    return x + y + phi_T


def hw2f_zcb(a1: float, sigma1: float, a2: float, sigma2: float,
              rho: float, r0: float, T: float) -> float:
    """
    HW2F closed-form ZCB price (Brigo-Mercurio, Chapter 4):
    P(0,T) = exp(A(T) - B1(T)*x0 - B2(T)*y0)
    B1(T) = (1 - exp(-a1*T)) / a1
    B2(T) = (1 - exp(-a2*T)) / a2
    """
    def B(a, t): return (1.0 - np.exp(-a*t)) / a
    def V(t):
        return (sigma1**2/a1**2 * (t - 2*B(a1,t) + B(a1,2*t)/2.0)
              + sigma2**2/a2**2 * (t - 2*B(a2,t) + B(a2,2*t)/2.0)
              + 2*rho*sigma1*sigma2/(a1*a2)*(t - B(a1,t) - B(a2,t) + B(a1+a2,t)))

    log_P = -r0 * T + 0.5 * V(T)
    return np.exp(log_P)


def hw2f_caplet(a1, sigma1, a2, sigma2, rho, r0, T_start, T_end, K, notional=1.0):
    """
    Caplet: pays at T_end: max(L(T_start, T_end) - K, 0) * tau * notional
    Under HW2F: caplet ~ Black formula with effective vol.
    """
    from scipy.integrate import quad

    tau  = T_end - T_start
    P_s  = hw2f_zcb(a1, sigma1, a2, sigma2, rho, r0, T_start)
    P_e  = hw2f_zcb(a1, sigma1, a2, sigma2, rho, r0, T_end)
    F_L  = (P_s / P_e - 1.0) / tau   # forward LIBOR / SOFR

    # Effective caplet vol (integral of bond option variance)
    def integrand(t):
        B1 = (1 - np.exp(-a1*(T_start - t))) / a1
        B2 = (1 - np.exp(-a2*(T_start - t))) / a2
        return (sigma1*B1)**2 + (sigma2*B2)**2 + 2*rho*sigma1*sigma2*B1*B2

    vol2_T, _ = quad(integrand, 0.0, T_start)
    sigma_eff  = np.sqrt(vol2_T) / tau if tau > 0 else 0.0

    if sigma_eff < 1e-10:
        return tau * notional * P_e * max(F_L - K, 0.0)

    d1 = (np.log(F_L / K) + 0.5 * sigma_eff**2) / sigma_eff
    d2 = d1 - sigma_eff
    price = P_e * tau * notional * (F_L*norm.cdf(d1) - K*norm.cdf(d2))
    return price


# Demo: caplet pricing + ZCB curve
a1, sigma1 = 1.0, 0.01
a2, sigma2 = 0.1, 0.005
rho, r0    = -0.5, 0.05

print("ZCB curve (HW2F):")
for T in [0.5, 1, 2, 3, 5, 7, 10]:
    p = hw2f_zcb(a1, sigma1, a2, sigma2, rho, r0, T)
    print(f"  T={T:.1f}Y  P(0,T)={p:.5f}  z={(-np.log(p)/T)*100:.3f}%")

print("\\nCaplets (strike=5%):")
for Ts, Te in [(1, 1.5), (2, 2.5), (3, 3.5), (5, 5.5)]:
    cap = hw2f_caplet(a1, sigma1, a2, sigma2, rho, r0, Ts, Te, 0.05)
    print(f"  [{Ts}Y-{Te}Y]  caplet={cap*10000:.4f} bps")`,
    explanation:
      "The Hull-White 2-factor model extends HW1F by adding a second mean-reverting factor with a different speed, allowing the model to fit both the volatility level and the shape of the volatility term structure simultaneously. The negative correlation (rho < 0) between factors is typical: a positive shock to the short end is partially offset by the long end, creating a realistic hump in the vol term structure. HW2F is the minimum model for pricing Bermudan swaptions across multiple exercise dates where a single factor creates mispricing in the smile.",
  },
  {
    id: "pyfin-20260527-b1-arb-free-smile",
    language: "python",
    title: "Vol surface arbitrage detection — calendar and butterfly spreads",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.stats import norm

def total_variance(K: float, F: float, sigma: float, T: float) -> float:
    """Total implied variance w = sigma^2 * T."""
    return sigma**2 * T


def check_calendar_arbitrage(sigmas: np.ndarray, maturities: np.ndarray) -> pd.DataFrame:
    """
    Calendar spread arbitrage (no-arbitrage condition):
    Total variance w(K, T) must be non-decreasing in T for fixed K.
    If w(K, T2) < w(K, T1) for T2 > T1: calendar spread arbitrage exists.
    Also: forward variance = dw/dT must be >= 0.
    """
    issues = []
    for i in range(1, len(maturities)):
        T1, T2 = maturities[i-1], maturities[i]
        for j, K_idx in enumerate(range(len(sigmas[0]))):
            w1 = sigmas[i-1, j]**2 * T1
            w2 = sigmas[i,   j]**2 * T2
            if w2 < w1 - 1e-8:
                issues.append({
                    "type": "calendar",
                    "T1": T1, "T2": T2, "strike_idx": K_idx,
                    "w1": w1, "w2": w2, "violation": w1 - w2
                })
    return pd.DataFrame(issues) if issues else pd.DataFrame(columns=["type","T1","T2","violation"])


def check_butterfly_arbitrage(strikes: np.ndarray, sigmas_row: np.ndarray,
                                F: float, T: float) -> pd.DataFrame:
    """
    Butterfly arbitrage (no-arbitrage condition):
    Risk-neutral density g(K) = d^2 C / dK^2 must be >= 0 (density non-negative).
    In terms of total variance w(K):
    g(K) = [1 - y*dw/dy / (2w) + (dw/dy)^2/4*(1/w + 1/4) + d^2w/dy^2/2] * BS_density
    where y = log(K/F).  If this expression < 0: butterfly arbitrage.
    """
    n = len(strikes)
    y = np.log(strikes / F)

    issues = []
    for i in range(1, n-1):
        dK  = (strikes[i+1] - strikes[i-1]) / 2.0
        w   = sigmas_row[i]**2 * T
        w_p = sigmas_row[i+1]**2 * T
        w_m = sigmas_row[i-1]**2 * T
        dy  = y[i+1] - y[i-1]

        dw_dy  = (w_p - w_m) / dy
        d2w_dy2 = (w_p - 2*w + w_m) / ((dy/2)**2)

        if w < 1e-10: continue
        g = (1.0 - y[i]*dw_dy/(2*w)
             + dw_dy**2/4*(1.0/w - 0.25)
             + 0.5*d2w_dy2)

        if g < 0:
            issues.append({
                "type":      "butterfly",
                "K":         strikes[i],
                "y":         y[i],
                "g_density": g,
                "violation": -g
            })
    return pd.DataFrame(issues) if issues else pd.DataFrame(columns=["type","K","violation"])


# Build a test vol surface with a deliberate butterfly violation at K=130
F = 100.0
strikes    = np.array([80, 90, 100, 110, 120, 130, 140])
maturities = np.array([0.25, 0.5, 1.0, 2.0])

# Clean surface
sigmas_clean = np.outer(np.array([0.25, 0.22, 0.20, 0.19]), np.array([0.25,0.22,0.20,0.20,0.21,0.22,0.24]))

# Inject butterfly violation at T=1Y, K=130 (drop vol too sharply)
sigmas_dirty = sigmas_clean.copy()
sigmas_dirty[2, 5] = 0.05   # unrealistically low vol at 1Y K=130

cal_arb  = check_calendar_arbitrage(sigmas_clean, maturities)
bfly_arb = check_butterfly_arbitrage(strikes, sigmas_dirty[2], F, maturities[2])

print(f"Calendar arbitrages (clean): {len(cal_arb)}")
print(f"Butterfly arbitrages (dirty): {len(bfly_arb)}")
if len(bfly_arb) > 0:
    print(bfly_arb.to_string(index=False))`,
    explanation:
      "A vol surface is arbitrage-free if and only if: (1) total variance is non-decreasing in maturity (no calendar spread arb) and (2) the implied risk-neutral density is non-negative (no butterfly spread arb). Condition (1) catches cases where near-term options are more expensive than long-dated ones — a free lunch. Condition (2) corresponds to the density having no negative regions — technically, negative density means you can trade a butterfly spread for a positive premium with non-negative payoff. Before bootstrapping local vol or calibrating stochastic vol models, the input surface must pass both checks.",
  },
  {
    id: "pyfin-20260527-b1-pcr-macro",
    language: "python",
    title: "Principal component regression for macro factor timing",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.linear_model import Ridge
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import r2_score

def pcr_macro_timing(macro_features: pd.DataFrame,
                      asset_returns: pd.Series,
                      n_components: int = 5,
                      alpha_ridge: float = 1.0,
                      n_cv_folds: int = 5,
                      horizon: int = 21) -> dict:
    """
    Principal Component Regression for macro factor timing.
    Problem: many correlated macro indicators (> 50) make standard regression
    overfit. PCR: (1) PCA on macro features to get K orthogonal factors,
    (2) Ridge regression of forward returns on K PCs.

    Steps:
    1. Standardise features.
    2. PCA: reduce d macroeconomic series to K principal components.
    3. Align with h-step-ahead returns (horizon = 21 trading days).
    4. Cross-validated Ridge on PCs to find optimal lambda.
    5. Out-of-sample IC (rank correlation of predicted vs realised).
    """
    from scipy.stats import spearmanr

    scaler = StandardScaler()
    pca    = PCA(n_components=n_components)
    ridge  = Ridge(alpha=alpha_ridge)

    # Align features with forward returns
    fwd_ret = asset_returns.shift(-horizon).dropna()
    common  = macro_features.index.intersection(fwd_ret.index)
    X       = macro_features.loc[common].fillna(method="ffill").values
    y       = fwd_ret.loc[common].values

    # Remove NaN rows
    valid = ~np.any(np.isnan(X), axis=1) & ~np.isnan(y)
    X, y  = X[valid], y[valid]

    # Walk-forward cross-validation
    tscv = TimeSeriesSplit(n_splits=n_cv_folds)
    oos_preds, oos_actual = [], []

    for train_idx, test_idx in tscv.split(X):
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]

        X_train_s = scaler.fit_transform(X_train)
        X_test_s  = scaler.transform(X_test)

        pcs_train = pca.fit_transform(X_train_s)
        pcs_test  = pca.transform(X_test_s)

        ridge.fit(pcs_train, y_train)
        y_hat = ridge.predict(pcs_test)

        oos_preds.extend(y_hat)
        oos_actual.extend(y_test)

    oos_preds  = np.array(oos_preds)
    oos_actual = np.array(oos_actual)

    ic, _   = spearmanr(oos_preds, oos_actual)
    r2_oos  = r2_score(oos_actual, oos_preds)

    # Full-sample PCA for factor interpretation
    X_all_s    = scaler.fit_transform(X)
    pca.fit(X_all_s)
    explained  = pca.explained_variance_ratio_

    return {
        "oos_ic":      ic,
        "oos_r2":      r2_oos,
        "explained_variance": explained,
        "n_components": n_components,
        "predictions":  oos_preds,
        "actuals":      oos_actual,
    }


# Simulate 5 correlated macro features + equity returns
rng = np.random.default_rng(42)
T   = 500
dates  = pd.date_range("2019-01-01", periods=T, freq="B")

# True macro factors
factor_level   = np.cumsum(rng.normal(0, 1, T)) * 0.1
factor_momentum = np.diff(factor_level, prepend=0)

macro = pd.DataFrame({
    "yield_2y":   5.0 + factor_level + rng.normal(0, 0.5, T),
    "yield_10y":  5.5 + 0.8*factor_level + rng.normal(0, 0.4, T),
    "credit_oas": 100 - 20*factor_level + rng.normal(0, 10, T),
    "pmi":        55  + 5*factor_momentum + rng.normal(0, 2, T),
    "vix":        20  - 10*factor_momentum + rng.normal(0, 5, T),
}, index=dates)

# Asset returns driven by macro
eq_ret = pd.Series(
    0.01 * factor_momentum + rng.normal(0, 0.015, T), index=dates
)

result = pcr_macro_timing(macro, eq_ret, n_components=3, horizon=21)
print(f"OOS IC (rank corr):       {result['oos_ic']:.4f}")
print(f"OOS R-squared:            {result['oos_r2']:.4f}")
print(f"Explained variance (PCs): {np.round(result['explained_variance']*100, 1)}")`,
    explanation:
      "PCR handles the high-dimensional, highly-correlated macro feature problem that breaks ordinary least squares: instead of regressing on 50 correlated macro series (massive overfitting), it first extracts 5 orthogonal principal components that capture most of the variance, then regresses forward returns on those PCs. The first PC typically captures the general level of economic activity; the second captures slope (yield curve shape); the third captures credit/risk appetite. Walk-forward CV prevents look-ahead bias — critical for macro timing models where signal half-life is measured in months.",
  },
];
