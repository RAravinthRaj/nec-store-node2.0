/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const updateProductTypeDef = gql`
  input UpdateProductInput {
    id: ID!
    title: String
    categoryId: String
    quantity: Int
    buyingPrice: Float
    sellingPrice: Float
    productImage: String
    isDeleted: Boolean
  }

  type UpdateProductResponse {
    message: String!
  }

  type Mutation {
    updateProduct(input: UpdateProductInput!): UpdateProductResponse!
  }
`;
