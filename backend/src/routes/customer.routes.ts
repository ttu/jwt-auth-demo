import { Router, Response } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware';
import { RequestWithUser } from '../types/index';

const router = Router();

// Dummy customer list data for CRM demo
const customerList = [
  { id: 1, name: 'Acme Corporation', email: 'contact@acme.com' },
  { id: 2, name: 'Global Industries', email: 'info@globalindustries.com' },
  { id: 3, name: 'Tech Solutions Ltd', email: 'hello@techsolutions.com' },
  { id: 4, name: 'Smith & Associates', email: 'team@smithassociates.com' },
  { id: 5, name: 'Innovation Labs', email: 'support@innovationlabs.com' },
];

// Protected route to get customer list
router.get('/list', verifyAccessToken, (_req: RequestWithUser, res: Response) => {
  try {
    // Ensure we're sending an array
    if (!Array.isArray(customerList)) {
      throw new Error('Customer list is not an array');
    }
    res.json(customerList);
  } catch (error) {
    console.error('Error in /customers/list route:', error);
    res.status(500).json({ message: 'Error fetching customer list' });
  }
});

export default router;
