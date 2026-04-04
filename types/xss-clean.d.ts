/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

declare module 'xss-clean' {
  import { RequestHandler } from 'express';

  const xssClean: () => RequestHandler;
  export default xssClean;
}
