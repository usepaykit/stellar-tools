export type CheckoutResult = {
    type: "checkout";
    checkout: {
        url: string;
    };
};



export type StellarResult<T> = T | CheckoutResult;
