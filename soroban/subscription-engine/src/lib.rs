#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol};

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
    /// Wallet calls this. Bundled with 'approve' in the XDR.
    pub fn start(e: Env, customer: Address, merchant: Address, token: Address, product_id: Symbol, amount: i128, duration: u64) {
        customer.require_auth();

        // 1. Take first payment (Requires the 'approve' that was in the same XDR)
        token::Client::new(&e, &token).transfer_from(&e.current_contract_address(), &customer, &merchant, &amount);

        // 2. Save Sub
        let sub = Subscription {
            customer: customer.clone(),
            merchant,
            token,
            amount,
            period_duration: duration,
            period_end: e.ledger().timestamp() + duration,
            status: Status::Active,
        };
        e.storage().persistent().set(&(customer, product_id), &sub);
    }

    pub fn charge(e: Env, customer: Address, product_id: Symbol) {
        let key = (customer, product_id);
        let mut sub: Subscription = e.storage().persistent().get(&key).expect("Not found");

        if sub.status == Status::Active && e.ledger().timestamp() >= sub.period_end {
            token::Client::new(&e, &sub.token).transfer_from(&e.current_contract_address(), &sub.customer, &sub.merchant, &sub.amount);
            sub.period_end += sub.period_duration;
            e.storage().persistent().set(&key, &sub);
        }
    }

    pub fn resume(e: Env, customer: Address, product_id: Symbol) {
        customer.require_auth();
        let mut sub: Subscription = e.storage().persistent().get(&(customer.clone(), product_id.clone())).unwrap();
        
        // Only allow resume if we are still "in period" i.e the period_end is in the future
        let now = e.ledger().timestamp();
        if now <= sub.period_end {
            sub.status = Status::Active;
            e.storage().persistent().set(&(customer, product_id), &sub);
        } else {
            panic!("Subscription period has already ended, cannot resume");
        }
    }

    pub fn pause(e: Env, customer: Address, product_id: Symbol) {
        customer.require_auth();
        let mut sub: Subscription = e.storage().persistent().get(&(customer.clone(), product_id.clone())).unwrap();
        sub.status = Status::Paused;
        e.storage().persistent().set(&(customer, product_id), &sub);
    }

    pub fn cancel(e: Env, customer: Address, product_id: Symbol) {
        customer.require_auth();
        let mut sub: Subscription = e.storage().persistent().get(&(customer.clone(), product_id.clone())).unwrap();
        sub.status = Status::Canceled;
        e.storage().persistent().set(&(customer, product_id), &sub);
    }

    pub fn get_subscription(e: Env, customer: Address, product_id: Symbol) -> Subscription {
        match e.storage().persistent().get(&(customer.clone(), product_id.clone())) {
            Some(sub) => sub,
            None => panic!("Subscription not found"),
        }
    }

    pub fn update_subscription(e: Env, customer: Address, product_id: Symbol, status: Option<Status>, period_duration: Option<u64>, period_end: Option<u64>) {
        customer.require_auth();
        let mut sub: Subscription = match e.storage().persistent().get(&(customer.clone(), product_id.clone())) {
            Some(sub) => sub,
            None => panic!("Subscription not found"),
        };
        
        if let Some(new_status) = status {
            sub.status = new_status;
        }
        if let Some(new_period_duration) = period_duration {
            sub.period_duration = new_period_duration;
        }
        if let Some(new_period_end) = period_end {
            sub.period_end = new_period_end;
        }
        e.storage().persistent().set(&(customer, product_id), &sub);
    }
}