#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol, symbol_short
};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Status { Active = 1, Paused = 2, Canceled = 3 }

#[contracttype]
#[derive(Clone, Debug)]
pub struct Subscription {
    pub customer: Address,
    pub merchant: Address,
    pub token: Address,
    pub amount: i128,
    pub period_duration: u64,
    pub period_end: u64,
    pub status: Status,
}

#[contract]
pub struct SubscriptionEngine;

#[contractimpl]
impl SubscriptionEngine {
    /// Initial signature by Customer. 
    /// Bundles Approval + Start + First Payment.
    pub fn start(e: Env, customer: Address, merchant: Address, token: Address, product_id: Symbol, amount: i128, duration: u64) {
        customer.require_auth();

        // Transfer first payment immediately
        token::Client::new(&e, &token).transfer_from(&e.current_contract_address(), &customer, &merchant, &amount);

        let sub = Subscription {
            customer: customer.clone(),
            merchant,
            token,
            amount,
            period_duration: duration,
            period_end: e.ledger().timestamp() + duration,
            status: Status::Active,
        };
        
        e.storage().persistent().set(&(customer.clone(), product_id.clone()), &sub);

        // Emit event for backend indexing
        e.events().publish((symbol_short!("sub_start"), customer, product_id), amount);
    }

    /// Backend/Cron calls this.
    /// If this returns without error, the payment WAS successful.
    pub fn charge(e: Env, customer: Address, product_id: Symbol) {
        let key = (customer.clone(), product_id.clone());
        let mut sub: Subscription = e.storage().persistent().get(&key).expect("Sub not found");

        if sub.status != Status::Active { panic!("Inactive sub"); }
        if e.ledger().timestamp() < sub.period_end { panic!("Period not ended"); }

        // Execute transfer. If user has no funds, this line PANICS.
        // If it panics, the lines below (updating period_end) NEVER run.
        token::Client::new(&e, &sub.token).transfer_from(&e.current_contract_address(), &sub.customer, &sub.merchant, &sub.amount);

        // Success! Update state
        sub.period_end += sub.period_duration;
        e.storage().persistent().set(&key, &sub);

        // This is what your Webhook system listens for
        e.events().publish((symbol_short!("sub_pay"), customer, product_id), (sub.amount, sub.period_end));
    }

    pub fn resume(e: Env, customer: Address, product_id: Symbol) {
        let key = (customer.clone(), product_id.clone());
        let mut sub: Subscription = e.storage().persistent().get(&key).unwrap();
        
        // Authorization: Customer OR Merchant
        Self::check_auth(&e, &customer, &sub.merchant);

        if e.ledger().timestamp() > sub.period_end { panic!("Period ended"); }

        sub.status = Status::Active;
        e.storage().persistent().set(&key, &sub);
        e.events().publish((symbol_short!("sub_res"), customer, product_id), ());
    }

    pub fn pause(e: Env, customer: Address, product_id: Symbol) {
        let key = (customer.clone(), product_id.clone());
        let mut sub: Subscription = e.storage().persistent().get(&key).unwrap();
        
        Self::check_auth(&e, &customer, &sub.merchant);

        sub.status = Status::Paused;
        e.storage().persistent().set(&key, &sub);
        e.events().publish((symbol_short!("sub_pau"), customer, product_id), ());
    }

    pub fn cancel(e: Env, customer: Address, product_id: Symbol) {
        let key = (customer.clone(), product_id.clone());
        let mut sub: Subscription = e.storage().persistent().get(&key).unwrap();
        
        Self::check_auth(&e,&customer, &sub.merchant);

        sub.status = Status::Canceled;
        e.storage().persistent().set(&key, &sub);
        e.events().publish((symbol_short!("sub_can"), customer, product_id), ());
    }

    // --- Helpers ---

    /// Custom Auth Logic: OR (Customer signs OR Merchant signs)
    fn check_auth(e: &Env, customer: &Address, merchant: &Address) {
     // 1. We check if the customer has provided authorization for this call.
        // We look at the authorized addresses in the current environment.
        let authorized = e.auth().get_authorized_invocations();
        
    // 2. We check if the customer is among the authorized signers
    let is_customer = authorized.iter().any(|inv| inv.address == *customer);

    if is_customer {
        // If the customer signed it, satisfy the requirement
        customer.require_auth();
    } else {
        // If the customer didn't sign it, the merchant MUST have signed it
        merchant.require_auth();
    }
    }

    pub fn get_subscription(e: Env, customer: Address, product_id: Symbol) -> Subscription {
        e.storage().persistent().get(&(customer, product_id)).expect("Sub not found")
    }
}