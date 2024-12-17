import { UIComponent } from './UIComponent';
import { Vector2D } from '../../core/components/TransformComponent';
import { EventBus } from '../../core/EventBus';
import { ShopSystem } from '../../systems/ShopSystem';
import { ShopCategory, ShopItem } from '../../types/ShopTypes';
import { Button } from './Button';

export class ShopUI extends UIComponent {
  private readonly shopSystem: ShopSystem;
  private readonly buttons: Map<string, Button>;
  private selectedCategory: ShopCategory;
  private itemsPerPage: number = 6;
  private currentPage: number = 0;

  constructor(
    position: Vector2D,
    size: Vector2D,
    eventBus: EventBus,
    shopSystem: ShopSystem
  ) {
    super(position, size, eventBus);
    this.shopSystem = shopSystem;
    this.buttons = new Map();
    this.selectedCategory = ShopCategory.WEAPONS;
    this.setupUI();
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    // Draw shop background
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);

    // Draw category tabs
    this.renderCategories(ctx);

    // Draw items grid
    this.renderItems(ctx);

    // Draw navigation buttons
    this.renderNavigation(ctx);

    ctx.restore();
  }

  private setupUI(): void {
    // Create category buttons
    Object.values(ShopCategory).forEach((category, index) => {
      const button = new Button(
        { x: this.position.x + index * 120, y: this.position.y },
        { x: 100, y: 30 },
        category,
        () => this.selectCategory(category),
        this.eventBus
      );
      this.buttons.set(`category_${category}`, button);
    });

    // Create navigation buttons
    const prevButton = new Button(
      { x: this.position.x + 10, y: this.position.y + this.size.y - 40 },
      { x: 80, y: 30 },
      'Previous',
      () => this.previousPage(),
      this.eventBus
    );
    this.buttons.set('prev', prevButton);

    const nextButton = new Button(
      { x: this.position.x + this.size.x - 90, y: this.position.y + this.size.y - 40 },
      { x: 80, y: 30 },
      'Next',
      () => this.nextPage(),
      this.eventBus
    );
    this.buttons.set('next', nextButton);
  }

  private renderCategories(ctx: CanvasRenderingContext2D): void {
    Object.values(ShopCategory).forEach((category, index) => {
      const button = this.buttons.get(`category_${category}`);
      if (button) {
        button.render(ctx);
      }
    });
  }

  private renderItems(ctx: CanvasRenderingContext2D): void {
    const items = this.shopSystem.getCategoryItems(this.selectedCategory);
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, items.length);

    const itemWidth = 200;
    const itemHeight = 250;
    const columns = 3;
    const padding = 20;

    for (let i = startIndex; i < endIndex; i++) {
      const item = items[i];
      const col = (i - startIndex) % columns;
      const row = Math.floor((i - startIndex) / columns);
      const x = this.position.x + padding + col * (itemWidth + padding);
      const y = this.position.y + 50 + row * (itemHeight + padding);

      this.renderItemCard(ctx, item, x, y, itemWidth, itemHeight);
    }
  }

  private renderItemCard(
    ctx: CanvasRenderingContext2D,
    item: ShopItem,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Draw card background
    ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
    ctx.fillRect(x, y, width, height);

    // Draw item icon
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(item.icon, x + width / 2, y + 40);

    // Draw item name
    ctx.font = 'bold 16px Arial';
    ctx.fillText(item.name, x + width / 2, y + 80);

    // Draw item description
    ctx.font = '14px Arial';
    const words = item.description.split(' ');
    let line = '';
    let lineY = y + 110;
    words.forEach(word => {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width - 20) {
        ctx.fillText(line, x + width / 2, lineY);
        line = word + ' ';
        lineY += 20;
      } else {
        line = testLine;
      }
    });
    ctx.fillText(line, x + width / 2, lineY);

    // Draw price
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`${item.price} coins`, x + width / 2, y + height - 60);

    // Draw purchase button
    const buttonY = y + height - 40;
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(x + 20, buttonY, width - 40, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Purchase', x + width / 2, buttonY + 20);
  }

  private renderNavigation(ctx: CanvasRenderingContext2D): void {
    const prevButton = this.buttons.get('prev');
    const nextButton = this.buttons.get('next');

    if (prevButton && nextButton) {
      prevButton.render(ctx);
      nextButton.render(ctx);
    }
  }

  private selectCategory(category: ShopCategory): void {
    this.selectedCategory = category;
    this.currentPage = 0;
  }

  private previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  private nextPage(): void {
    if (this.currentPage < this.getMaxPages() - 1) {
      this.currentPage++;
    }
  }

  private getMaxPages(): number {
    const items = this.shopSystem.getCategoryItems(this.selectedCategory);
    return Math.ceil(items.length / this.itemsPerPage);
  }

  public override handleInput(event: MouseEvent | TouchEvent): boolean {
    if (!this.visible) return false;

    const mousePos = this.getEventPosition(event);

    // Handle button clicks
    for (const button of this.buttons.values()) {
      if (button.handleInput(event)) {
        return true;
      }
    }

    // Handle item card clicks
    if (event.type === 'mouseup' || event.type === 'touchend') {
      const items = this.shopSystem.getCategoryItems(this.selectedCategory);
      const startIndex = this.currentPage * this.itemsPerPage;
      const endIndex = Math.min(startIndex + this.itemsPerPage, items.length);

      for (let i = startIndex; i < endIndex; i++) {
        const item = items[i];
        const col = (i - startIndex) % 3;
        const row = Math.floor((i - startIndex) / 3);
        const x = this.position.x + 20 + col * 220;
        const y = this.position.y + 50 + row * 270;

        // Check if click is within purchase button area
        if (
          mousePos.x >= x + 20 &&
          mousePos.x <= x + 180 &&
          mousePos.y >= y + 210 &&
          mousePos.y <= y + 240
        ) {
          const result = this.shopSystem.purchaseItem(item.id);
          if (!result.success) {
            this.eventBus.emit({
              type: 'SHOW_NOTIFICATION',
              payload: { message: result.message, type: 'error' }
            });
          }
          return true;
        }
      }
    }

    return false;
  }
}
