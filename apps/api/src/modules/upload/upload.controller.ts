import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload single image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    return this.uploadService.uploadImage(file, folder);
  }

  @Post('images')
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    return this.uploadService.uploadMultipleImages(files, folder);
  }

  @Delete('image')
  @ApiOperation({ summary: 'Delete image' })
  async deleteImage(@Body() body: { publicId: string }) {
    await this.uploadService.deleteImage(body.publicId);
    return { message: 'Image deleted successfully' };
  }

  @Delete('images')
  @ApiOperation({ summary: 'Delete multiple images' })
  async deleteImages(@Body() body: { publicIds: string[] }) {
    await this.uploadService.deleteMultipleImages(body.publicIds);
    return { message: 'Images deleted successfully' };
  }

  @Get('signed-url')
  @ApiOperation({ summary: 'Get signed upload URL for client-side upload' })
  async getSignedUrl(@Query('folder') folder?: string) {
    return this.uploadService.getSignedUploadUrl(folder);
  }
}
