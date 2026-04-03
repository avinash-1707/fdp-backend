import { RecordsRepository } from "./records.repository";
import { AppError } from "../../utils/AppError";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "../../utils/pagination";
import type {
  CreateRecordInput,
  UpdateRecordInput,
  ListRecordsQuery,
} from "./records.schemas";
import type { Role } from "../../generated/prisma/enums";

const recordsRepository = new RecordsRepository();

interface RequestingUser {
  userId: string;
  role: Role;
}

export class RecordsService {
  async listRecords(query: ListRecordsQuery, requestingUser: RequestingUser) {
    const { page, limit } = getPaginationParams(query.page, query.limit);

    // VIEWERs only see their own records; ANALYST and ADMIN see all
    const scopeToUserId =
      requestingUser.role === "VIEWER" ? requestingUser.userId : undefined;

    const { records, total } = await recordsRepository.findAll({
      page,
      limit,
      userId: scopeToUserId,
      type: query.type,
      category: query.category,
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const meta = buildPaginationMeta(total, page, limit);
    return { records, meta };
  }

  async getRecordById(id: string, requestingUser: RequestingUser) {
    const record = await recordsRepository.findById(id);

    if (!record) {
      throw AppError.notFound(`Record with id '${id}' not found`);
    }

    // VIEWERs can only access their own records
    if (
      requestingUser.role === "VIEWER" &&
      record.userId !== requestingUser.userId
    ) {
      throw AppError.forbidden("You do not have access to this record");
    }

    return record;
  }

  async createRecord(data: CreateRecordInput, requestingUser: RequestingUser) {
    return recordsRepository.create({
      ...data,
      userId: requestingUser.userId,
    });
  }

  async updateRecord(
    id: string,
    data: UpdateRecordInput,
    requestingUser: RequestingUser,
  ) {
    const record = await recordsRepository.findById(id);

    if (!record) {
      throw AppError.notFound(`Record with id '${id}' not found`);
    }

    // ANALYSTs can only edit their own records; ADMINs can edit any
    if (
      requestingUser.role === "ANALYST" &&
      record.userId !== requestingUser.userId
    ) {
      throw AppError.forbidden("You can only edit your own records");
    }

    return recordsRepository.update(id, data);
  }

  async deleteRecord(id: string) {
    // Only ADMINs reach this (enforced at route level), but we still
    // verify the record exists for a clean 404 response
    const exists = await recordsRepository.existsById(id);

    if (!exists) {
      throw AppError.notFound(`Record with id '${id}' not found`);
    }

    await recordsRepository.softDelete(id);
  }
}
