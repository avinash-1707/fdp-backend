import type { Request, Response, NextFunction } from "express";
import { RecordsService } from "./records.service";
import { successResponse } from "../../utils/apiResponse";
import type {
  CreateRecordInput,
  ListRecordsQuery,
  UpdateRecordInput,
} from "./records.schemas";

const recordsService = new RecordsService();

export class RecordsController {
  async listRecords(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { records, meta } = await recordsService.listRecords(
        req.query as unknown as ListRecordsQuery,
        req.user!,
      );
      res
        .status(200)
        .json(successResponse("Records retrieved successfully", records, meta));
    } catch (error) {
      next(error);
    }
  }

  async getRecordById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const record = await recordsService.getRecordById(id, req.user!);
      res
        .status(200)
        .json(successResponse("Record retrieved successfully", record));
    } catch (error) {
      next(error);
    }
  }

  async createRecord(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const record = await recordsService.createRecord(
        req.body as CreateRecordInput,
        req.user!,
      );
      res
        .status(201)
        .json(successResponse("Record created successfully", record));
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const record = await recordsService.updateRecord(
        id,
        req.body as UpdateRecordInput,
        req.user!,
      );
      res
        .status(200)
        .json(successResponse("Record updated successfully", record));
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params["id"] as string;
      await recordsService.deleteRecord(id);
      res.status(200).json(successResponse("Record deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}
