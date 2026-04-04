/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
export enum Department {
  CSE = 'CSE',
  IT = 'IT',
  MECH = 'MECH',
  AIDS = 'AIDS',
  CIVIL = 'CIVIL',
  EEE = 'EEE',
  ECE = 'ECE',
}

export enum Role {
  Admin = 'admin',
  Retailer = 'retailer',
  Customer = 'customer',
}

export enum UserStatus {
  Active = 'active',
  Suspended = 'suspended',
}

export enum DeliveryStatus {
  DELIVERED = 'delivered',
  NOT_DELIVERED = 'not_delivered',
}

export enum PaidStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
}

export enum OrderStatus {
  CREATED = 'created',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentTransactionStatus {
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}
