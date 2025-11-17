import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { KeywordService } from './keyword.service';
import {
  CreateKeywordDto,
  UpdateKeywordDto,
  BatchCreateKeywordDto,
  BatchDeleteDto,
  KeywordResponseDto,
} from './dto/keyword.dto';

@ApiTags('Keyword - 关键词管理')
@Controller('keyword')
export class KeywordController {
  constructor(private readonly keywordService: KeywordService) {}

  @Get('list')
  @ApiOperation({ summary: '获取关键词列表' })
  @ApiResponse({
    status: 200,
    description: '返回关键词列表',
    type: [KeywordResponseDto],
  })
  async list() {
    const data = await this.keywordService.findAll();
    return { data, succeeded: true };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个关键词' })
  @ApiParam({ name: 'id', description: '关键词ID' })
  @ApiResponse({
    status: 200,
    description: '返回关键词详情',
    type: KeywordResponseDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.keywordService.findOne(id);
    return { data, succeeded: true };
  }

  @Post('add')
  @ApiOperation({ summary: '添加关键词' })
  @ApiBody({ type: CreateKeywordDto })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: KeywordResponseDto,
  })
  async add(@Body() createDto: CreateKeywordDto) {
    const data = await this.keywordService.create(createDto);
    return { data, succeeded: true };
  }

  @Post('batchadd')
  @ApiOperation({ summary: '批量添加关键词' })
  @ApiBody({ type: [CreateKeywordDto] })
  @ApiResponse({
    status: 201,
    description: '批量创建成功',
    type: [KeywordResponseDto],
  })
  async batchAdd(@Body() createDtos: CreateKeywordDto[]) {
    const data = await this.keywordService.batchCreate(createDtos);
    return { data, succeeded: true };
  }

  @Put('update/:id')
  @ApiOperation({ summary: '更新关键词' })
  @ApiParam({ name: 'id', description: '关键词ID' })
  @ApiBody({ type: UpdateKeywordDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: KeywordResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateKeywordDto,
  ) {
    const data = await this.keywordService.update(id, updateDto);
    return { data, succeeded: true };
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除关键词' })
  @ApiParam({ name: 'id', description: '关键词ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.keywordService.delete(id);
    return { succeeded: true, message: '删除成功' };
  }

  @Delete('batchdelete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量删除关键词' })
  @ApiBody({ type: BatchDeleteDto })
  @ApiResponse({ status: 200, description: '批量删除成功' })
  async batchDelete(@Body() batchDeleteDto: BatchDeleteDto) {
    await this.keywordService.batchDelete(batchDeleteDto.ids);
    return { succeeded: true, message: '批量删除成功' };
  }
}
