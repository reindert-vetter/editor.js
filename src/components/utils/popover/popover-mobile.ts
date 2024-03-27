import { Popover as PopoverBase } from './popover-abstract';
import ScrollLocker from '../scroll-locker';
import { PopoverHeader } from './components/popover-header';
import { PopoverStatesHistory } from './utils/popover-states-history';
import { PopoverParams } from './popover.typings';
import { PopoverItem } from './components/popover-item';
import { PopoverItem as PopoverItemParams } from '../../../../types';
import { css } from './popover.const';
import Dom from '../../dom';

/**
 * Class responsible for rendering popover and handling its behaviour on mobile screens
 */
export class PopoverMobile extends PopoverBase {
  /**
   * ScrollLocker instance
   */
  private scrollLocker = new ScrollLocker();

  /**
   * Reference to popover header if exists
   */
  private header: PopoverHeader | undefined | null;

  /**
   * History of popover states for back navigation.
   * Is used for mobile version of popover,
   * where we can not display nested popover of the screen and
   * have to render nested items in the same popover switching to new state
   */
  private history = new PopoverStatesHistory();

  /**
   * Construct the instance
   *
   * @param params - popover params
   */
  constructor(params: PopoverParams) {
    super(params);

    /* Save state to history for proper navigation between nested and parent popovers */
    this.history.push({ items: params.items });
  }

  /**
   * Open popover
   */
  public show(): void {
    this.nodes.overlay?.classList.remove(css.overlayHidden);

    super.show();

    this.scrollLocker.lock();
  }

  /**
   * Closes popover
   */
  public hide(): void {
    super.hide();

    this.scrollLocker.unlock();
  }

  /**
   * Clears memory
   */
  public destroy(): void {
    super.destroy();

    this.scrollLocker.unlock();
  }

  /**
   * Constructs HTML element corresponding to popover
   */
  protected override make(): void {
    super.make();

    this.nodes.overlay = Dom.make('div', [css.overlay, css.overlayHidden]);

    this.listeners.on(this.nodes.overlay, 'click', () => {
      this.hide();
    });

    this.nodes.popover.insertBefore(this.nodes.overlay, this.nodes.popover.firstChild);
  }

  /**
   * Handles displaying nested items for the item
   *
   * @param item – item to show nested popover for
   */
  protected override handleShowingNestedItems(item: PopoverItem): void {
    /** Show nested items */
    this.updateItemsAndHeader(item.children, item.title);

    this.history.push({
      title: item.title,
      items: item.children,
    });
  }

  /**
   * Removes rendered popover items and header and displays new ones
   *
   * @param title - new popover header text
   * @param items - new popover items
   */
  private updateItemsAndHeader(items: PopoverItemParams[], title?: string ): void {
    /** Re-render header */
    if (this.header !== null && this.header !== undefined) {
      this.header.destroy();
      this.header = null;
    }
    if (title !== undefined) {
      this.header = new PopoverHeader({
        text: title,
        onBackButtonClick: () => {
          this.history.pop();

          this.updateItemsAndHeader(this.history.currentItems, this.history.currentTitle);
        },
      });
      const headerEl = this.header.getElement();

      if (headerEl !== null) {
        this.nodes.popoverContainer?.insertBefore(headerEl, this.nodes.popoverContainer.firstChild);
      }
    }

    /** Re-render items */
    this.items.forEach(item => item.getElement()?.remove());

    this.items = items.map(params => new PopoverItem(params));

    this.items.forEach(item => {
      const itemEl = item.getElement();

      if (itemEl === null) {
        return;
      }
      this.nodes.items?.appendChild(itemEl);
    });
  }
}
