import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import dynamodbConfig from '../config/dynamodb.config';
import { CreateEmployeeDto } from './create-employee.dto';
import { UpdateEmployeeDto } from './update-employee.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '@elastic/elasticsearch';
import { Employee } from './employee.interface';

@Injectable()
export class EmployeeService {
  private readonly client: AWS.DynamoDB.DocumentClient;
  private readonly esClient: Client;

  constructor() {
    AWS.config.update(dynamodbConfig);
    this.client = new AWS.DynamoDB.DocumentClient();

    // Elasticsearch configuration
    this.esClient = new Client({ node: 'http://localhost:9200' });
  }

  async getAllEmployees(): Promise<any[]> {
    const searchParams = {
      index: 'employees',
      body: {
        query: {
          match_all: {},
        },
      },
    };

    const searchResult = await this.esClient.search(searchParams);
    return searchResult.body.hits.hits.map((hit: any) => hit._source);
  }

  async searchEmployeesByEmail(query: string): Promise<any[]> {
    const searchParams = {
      index: 'employees',
      body: {
        query: {
          match: {
            email: query,
          },
        },
      },
    };

    const searchResult = await this.esClient.search(searchParams);
    return searchResult.body.hits.hits.map((hit: any) => hit._source);
  }

  async createEmployee(createEmployeeDto: CreateEmployeeDto): Promise<void> {
    try {
      const { firstName, lastName, email, password, phoneNumber } =
        createEmployeeDto;

      const encryptedPassword = await bcrypt.hash(password, 10);

      const employee = {
        id: uuidv4(),
        firstName,
        lastName,
        email,
        password: encryptedPassword,
        phoneNumber,
        isDeleted: 0,
      };

      const params = {
        TableName: 'employees',
        Item: employee,
        ReturnValues: 'ALL_OLD',
      };

      await this.client.put(params).promise();

      // Index the employee data in Elasticsearch
      await this.indexEmployee(employee);
    } catch (error) {
      console.error('Error inserting employee:', error);
      throw new Error('Failed to create employee');
    }
  }

  async getEmployeeById(id: string): Promise<Employee> {
    const params = {
      TableName: 'employees',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id,
      },
    };

    const result = await this.client.query(params).promise();
    const employee = result.Items[0] as Employee;
    delete employee.password;
    return employee;
  }

  async updateEmployee(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const { firstName, lastName, phoneNumber } = updateEmployeeDto;

    const params = {
      TableName: 'employees',
      Key: { id: id },
      UpdateExpression: 'SET #fn = :fn, #ln = :ln, #pn = :pn',
      ExpressionAttributeNames: {
        '#fn': 'firstName',
        '#ln': 'lastName',
        '#pn': 'phoneNumber',
      },
      ExpressionAttributeValues: {
        ':fn': firstName,
        ':ln': lastName,
        ':pn': phoneNumber,
      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await this.client.update(params).promise();

    // Update the document in Elasticsearch
    const updatedEmployee = result.Attributes as Employee;
    await this.updateEmployeeInElasticsearch(updatedEmployee);

    delete updatedEmployee.password;

    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    const params = {
      TableName: 'employees',
      Key: { id: id },
      UpdateExpression: 'SET #isDeleted = :isDeleted',
      ExpressionAttributeNames: {
        '#isDeleted': 'isDeleted',
      },
      ExpressionAttributeValues: {
        ':isDeleted': 1,
      },
    };

    // Soft delete the employee in DynamoDB
    await this.client.update(params).promise();

    // Remove the employee from Elasticsearch
    await this.deleteEmployeeFromElasticsearch(id);
  }

  // methods for elasticsearch
  private async indexEmployee(employee: any): Promise<void> {
    const indexParams = {
      index: 'employees',
      id: employee.id,
      body: employee,
    };

    await this.esClient.index(indexParams);
  }

  private async updateEmployeeInElasticsearch(
    employee: Employee,
  ): Promise<void> {
    const indexParams = {
      index: 'employees',
      id: employee.id,
      body: { doc: employee },
    };

    await this.esClient.update(indexParams);
  }

  private async deleteEmployeeFromElasticsearch(id: string): Promise<void> {
    const deleteParams = {
      index: 'employees',
      id,
    };

    await this.esClient.delete(deleteParams);
  }
}
