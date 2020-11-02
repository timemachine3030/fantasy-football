// https://www.math.ucla.edu/~tom/distributions/gamma.html?

function LogGamma(Z) {
    var S=1+76.18009173/Z-86.50532033/(Z+1)+24.01409822/(Z+2)-1.231739516/(Z+3)+.00120858003/(Z+4)-.00000536382/(Z+5);
    var LG= (Z-.5) * Math.log(Z+4.5)-(Z+4.5)+Math.log(S*2.50662827465);
	return LG
}

function Gcf(X, A) {        // Good for X>A+1
		var A0=0;
		var B0=1;
		var A1=1;
		var B1=X;
		var AOLD=0;
		var N=0;
		while (Math.abs((A1-AOLD)/A1)>.00001) {
			AOLD=A1;
			N=N+1;
			A0=A1+(N-A)*A0;
			B0=B1+(N-A)*B0;
			A1=X*A0+N*A1;
			B1=X*B0+N*B1;
			A0=A0/B1;
			B0=B0/B1;
			A1=A1/B1;
			B1=1;
		}
		var Prob = Math.exp(A * Math.log(X)-X-LogGamma(A))*A1;
	return 1-Prob
}

function Gser(X,A) {        // Good for X<A+1.
    var T9=1/A;
    var G=T9;
    var I=1;
    while (T9>G*.00001) {
        T9=T9*X/(A+I);
        G=G+T9;
        I=I+1;
    }
    G = G * Math.exp(A * Math.log(X)-X-LogGamma(A));
    return G
}

function normalcdf(X){   //HASTINGS.  MAX ERROR = .000001
	var T=1/(1+.2316419*Math.abs(X));
	var D=.3989423 * Math.exp(-X * X / 2);
	var Prob = D * T * (.3193815 + T * (-.3565638 + T * (1.781478 + T * (-1.821256 + T * 1.330274))));
	if ( X > 0) {
		Prob = 1 - Prob
	}
	return Prob
}

function Gammacdf(x, a) {
	let GI;
	if (x<=0) {
		GI=0
	} else if (a > 200) {
		let z = (x - a) / Math.sqrt(a);
		let y = normalcdf(z)
		let b1 = 2 / Math.sqrt(a)
		let phiz = .39894228 * Math.exp(-z * z / 2);
		let w = y - b1 * (z * z - 1) * phiz / 6;  //Edgeworth1
		let b2 = 6 / a;
		let u = 3 * b2 * (z * z - 3) + b1 * b1 * (z ^ 4 - 10 * z * z + 15);
		GI=w-phiz*z*u/72        //Edgeworth2
	} else if (x<a+1) {
		GI=Gser(x,a)
	} else {
		GI=Gcf(x,a)
	}
	return GI
}

export const compute = function compute(X, A, B) {
    let prob;
	if (A<=0) {
		throw new Error('')
		console.log({A, B, X}, "alpha must be positive");
	} else if (B<=0) {
		console.log({A, B, X}, "beta must be positive")
	} else {
		prob = Gammacdf(X/B, A)
	}
	prob = round(prob);
    return prob;
}

export const round = (x, p = 100000) => Math.round(x * p) / p;

export const sigma = function sigma(start, end, modifier) {
    const length = end - start + 1;
    const map = (v, k) => modifier ? modifier(k + start) : k + start;
    const sum = (a, b) => a + b;

    return Array.from({ length }, map).reduce(sum);
}

export const mean = (sample, modifier = x => x) => {
	if (!sample.length) {
		return 0;
	}
	if (sample.length === 1) {
		return sample[0];
	}
	let total = sample.reduce((p, x) => {
		return p + modifier(x);
	}, 0);
	return total / sample.length;
}

const calcMeans = (sample) => {
	let m = [
		mean(sample),
		mean(sample, x => (x ** 2)),
	];
	m.push(Math.pow(m[0], 2));

	return m;
}
export const alphaFromHistory = (sample) => {
	const [m1, m2, mSqrd] = calcMeans(sample);
	return mSqrd/(m2 - mSqrd);
}
export const betaFromHistory = (sample) => {
	const [m1, m2, mSqrd] = calcMeans(sample);
	return (m2 - mSqrd) / m1;
}