/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Router } from 'express';
import { signIn } from '../controllers/signIn.controller';
import { createUser } from '../controllers/createUser.controller';
import { verifyOtp } from '../controllers/verifyOtp.controller';
import { getSession } from '../controllers/session.controller';
import { logout } from '../controllers/logout.controller';
import { authenticateJWT } from '../middlewares';

const router = Router();

router.post('/signup', createUser);
router.post('/signin', signIn);
router.post('/verify', verifyOtp);
router.get('/session', authenticateJWT, getSession);
router.post('/logout', logout);

export default router;
