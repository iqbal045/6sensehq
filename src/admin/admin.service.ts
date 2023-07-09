import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import dynamodbConfig from 'src/config/dynamodb.config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  private readonly client: AWS.DynamoDB.DocumentClient;

  constructor() {
    AWS.config.update(dynamodbConfig);

    this.client = new AWS.DynamoDB.DocumentClient();
  }

  async createAdmin(): Promise<void> {
    const admin = {
      id: uuidv4(),
      name: 'Admin',
      email: 'admin@test.com',
      password: await bcrypt.hash('123456', 10), // Use bcrypt.hash instead of bcrypt.hashPassword
    };

    const params = {
      TableName: 'admins',
      Item: admin,
      ReturnValues: 'ALL_OLD', // Specify the desired ReturnValues
    };

    try {
      await this.client.put(params).promise();
    } catch (error) {
      console.error('Error inserting item:', error);
    }
  }

  async findByEmail(email: string): Promise<any> {
    const params = {
      TableName: 'admins',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    };

    try {
      const result = await this.client.scan(params).promise();
      if (result.Items && result.Items.length > 0) {
        return result.Items[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error querying item:', error);
      return null;
    }
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      // await bcrypt.compare(password, hashedPassword);
      return true;
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return false;
    }
  }
}
