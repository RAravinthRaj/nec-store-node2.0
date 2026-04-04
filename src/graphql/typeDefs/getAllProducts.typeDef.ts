/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const getAllProductsTypeDef = gql`
  type GetAllProductsResponse {
    totalCount: Int!
    products: [Product!]!
  }

  type Query {
    getAllProducts(
      skip: Int
      limit: Int
      orderBy: OrderBy
      categoryId: ID
      title: String
      productIds: [ID!]
      isRecentProduct: Boolean
    ): GetAllProductsResponse!
  }
`;
