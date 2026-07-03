import { Test, TestingModule } from '@nestjs/testing';
import { LmsNotificationsController } from './lms-notifications.controller';

describe('LmsNotificationsController', () => {
  let controller: LmsNotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LmsNotificationsController],
    }).compile();

    controller = module.get<LmsNotificationsController>(LmsNotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
