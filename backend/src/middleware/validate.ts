import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        res.status(400).json({
          success: false,
          error: issues.length > 0 ? issues[0].message : 'Validation failed',
          details: issues,
        });
        return;
      }
      next(error);
    }
  };
};

export default validate;
