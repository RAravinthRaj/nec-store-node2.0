/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const getAllOrdersTypeDef = gql`
  type GetAllOrdersResponse {
    orders: [Order!]!
    totalCount: Int!
  }

  type Query {
    getAllOrders(
      skip: Int
      limit: Int
      orderId: String
      userId: String
      rollNumber: String
      orderBy: OrderBy
    ): GetAllOrdersResponse!
  }
`;
