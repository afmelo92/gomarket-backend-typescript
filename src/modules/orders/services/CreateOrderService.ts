import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const checkProductsExists = await this.productsRepository.findAllById(
      products,
    );

    const invalidProducts = products
      .map(product => checkProductsExists.find(p => p.id === product.id))
      .filter(prod => !prod);

    if (invalidProducts.length > 0) {
      const invalidProductsIds = invalidProducts.map(ip => ip?.id);
      throw new AppError(
        `Cannot create order with invalid products. ${invalidProductsIds}`,
      );
    }

    await this.productsRepository.updateQuantity(products);

    const finalProducts = checkProductsExists.map(product => {
      const requestProduct = products.find(p => p.id === product.id);
      return {
        product_id: product.id,
        price: product.price,
        quantity: requestProduct?.quantity || 0,
      };
    });
    const checkCustomerExists = await this.customersRepository.findById(
      customer_id,
    );

    if (!checkCustomerExists) {
      throw new AppError('Customer does not exists');
    }

    const order = await this.ordersRepository.create({
      customer: checkCustomerExists,
      products: finalProducts,
    });

    return order;
  }
}

export default CreateOrderService;
