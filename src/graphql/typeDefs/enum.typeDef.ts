/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const enumTypeDef = gql`
  enum UserStatus {
    active
    suspended
  }

  enum OrderBy {
    ASC
    DESC
  }

  enum Department {
    CSE
    IT
    MECH
    AIDS
    CIVIL
    EEE
    ECE
  }

  enum Role {
    customer
    retailer
    admin
  }

  enum DeliveryStatus {
    delivered
    not_delivered
  }

  enum PaidStatus {
    paid
    unpaid
  }

  enum OrderStatus {
    created
    cancelled
    completed
  }
`;
