import Joi from 'joi';

export const recommendationSettingsSchema = Joi.object({
  preferred_major_codes: Joi.array()
    .items(Joi.string().max(10))
    .max(5)
    .default([]),
  
  preferred_work_types: Joi.array()
    .items(Joi.string().max(20))
    .max(3)
    .default([]),
  
  preferred_areas: Joi.array()
    .items(Joi.string().max(10))
    .max(10)
    .default([]),
  
  salary_min: Joi.number()
    .min(0)
    .max(999999999)
    .default(0),
  
  salary_max: Joi.number()
    .min(0)
    .max(999999999)
    .default(999999999),
  
  notification_enabled: Joi.boolean()
    .default(true),
  
  notification_type: Joi.string()
    .valid('push', 'email', 'push,email', 'sms')
    .default('push,email')
});

export const feedbackSchema = Joi.object({
  recruit_idx: Joi.number()
    .integer()
    .positive()
    .required(),
  
  feedback_type: Joi.string()
    .valid('helpful', 'not_helpful', 'comment')
    .required(),
  
  comment: Joi.string()
    .max(500)
    .when('feedback_type', {
      is: 'comment',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
});

export const recommendationQuerySchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .default(5)
});