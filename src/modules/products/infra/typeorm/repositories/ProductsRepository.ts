import { getRepository, Repository } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findAllProducts = await this.ormRepository.findByIds(products);

    console.log(`FIND ALL PRODUCTS: ${JSON.stringify(findAllProducts)}`);

    return findAllProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const findAllProducts = await this.ormRepository.findByIds(products);

    const newProducts = findAllProducts.map(product => {
      const productFromRequest = products.find(p => p.id === product.id);

      if (!productFromRequest) {
        throw new AppError(`Invalid product ${product.id}`);
      }

      if (product.quantity < productFromRequest.quantity) {
        throw new AppError('Insufficient product quantity');
      }

      return {
        ...product,
        quantity: product.quantity - productFromRequest.quantity,
      };
    });

    await this.ormRepository.save(newProducts);
    return newProducts;
  }
}

export default ProductsRepository;
