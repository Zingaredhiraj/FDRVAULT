import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { sendSuccess } from '../utils/response';
import { prisma } from '../prisma';

const router = Router();
router.use(authenticate);

const updateSettingSchema = z.object({ value: z.string().min(1) });

router.get('/', async (req, res, next) => {
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    sendSuccess(res, settings);
  } catch (err) { next(err); }
});

router.put('/:key', authorize('SUPER_ADMIN'), validateBody(updateSettingSchema), async (req, res, next) => {
  try {
    const key = req.params.key as string;
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: req.body.value },
      update: { value: req.body.value },
    });
    sendSuccess(res, setting, 'Setting updated');
  } catch (err) { next(err); }
});

router.post('/clean-records', authorize('SUPER_ADMIN'), async (_req, res, next) => {
  try {
    await prisma.alertLog.deleteMany();
    await prisma.releaseStep.deleteMany();
    await prisma.releaseRequest.deleteMany();
    await prisma.document.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.fdr.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.institution.deleteMany();
    sendSuccess(res, { cleaned: true }, 'All institutions, FDRs, documents, and transactional records cleaned successfully.');
  } catch (err) { next(err); }
});

export default router;
