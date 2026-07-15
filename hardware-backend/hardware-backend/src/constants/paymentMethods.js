export const PAYMENT_METHODS = Object.freeze({
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MOBILE_WALLET: 'MOBILE_WALLET',
  CHEQUE: 'CHEQUE',
});

export const SALE_PAYMENT_MODES = Object.freeze({
  CASH: 'CASH',
  CREDIT: 'CREDIT',
  PARTIAL: 'PARTIAL',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MOBILE_WALLET: 'MOBILE_WALLET',
});

export const PAYMENT_DIRECTION = Object.freeze({
  IN: 'IN', // money received (customer payment)
  OUT: 'OUT', // money paid out (supplier payment)
});
