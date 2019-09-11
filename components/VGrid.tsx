import React from 'react';
import { animateScroll } from 'react-scroll';
import { ResizeObserver } from '@juggle/resize-observer'
import { InitialHashContext, InitialHashContextValue } from './InitialHashContext';

type GridStyleProperty = {
  gridGap: number;
  minContentLength?: number;
};

type GridStyle = {
  gridGap: number;
  gridTemplateColumns: string;
  display: 'grid';
  position: 'absolute';
  left: 0;
  right: 0;
};

type Props<T> = {
  items: T[];
  keyFn: (item: T) => string;
  children: (props: { item: T }) => JSX.Element;
  gridOptions: GridStyleProperty | ({ media: string } & GridStyleProperty)[],
  cellHeight: number;
};

type State = {
  isIntersecting: boolean;
  containerHeight: number;
  repeatLength: number;
  gridStyle: GridStyle;
  offsetIndex: number; // The first index of the cell displayed in viewport
  visibleItemsLength: number; // The number of cells to render
};

const createGridStyleObject = (opt: GridStyleProperty) => {
  return {
    display: 'grid',
    position: 'absolute',
    left: 0,
    right: 0,
    gridGap: opt.gridGap,
    gridTemplateColumns: opt.minContentLength ?  `repeat(auto-fill, minmax(${opt.minContentLength}px, 1fr))` : 'repeat(1, 1fr)',
  } as const;
};

const prerenderRowsLength = 1;

export class VGrid<T> extends React.Component<Props<T>, State> {

  static contextType = InitialHashContext;

  context!: InitialHashContextValue;
  containerRef = React.createRef<HTMLDivElement>();
  intersectionObserver?: IntersectionObserver;
  resizeObserver?: ResizeObserver;
  gridProperties: { media: MediaQueryList, prop: GridStyleProperty }[];
  previousContainerWidth?: number;

  state: State = {
    isIntersecting: false,
    offsetIndex: 0,
    repeatLength: 1,
    gridStyle: {
      display: 'grid',
      position: 'absolute',
      left: 0,
      right: 0,
      gridGap: -1,
      gridTemplateColumns: '',
    },
    containerHeight: 0,
    visibleItemsLength: 20,
  };

  constructor(props: Props<T>) {

    super(props);

    this.handleOnScroll = this.handleOnScroll.bind(this);
    this.handleOnHashChange = this.handleOnHashChange.bind(this);

    // Create pseudo CSS obj to emulate the media query such as:
    //
    // ```css
    // @media screen and (min-width: 320px) {
    //   ...
    // }
    // ```
    // The created pair MediaQueryList instance will be used to determine grid style properties
    //
    if (!Array.isArray(props.gridOptions)) {
      this.gridProperties = [{
        media: matchMedia('all'),
        prop: props.gridOptions,
      }];
    } else {
      this.gridProperties = props.gridOptions.slice().reverse().map(({ media, ...rest }) => ({
        media: matchMedia(media),
        prop: rest,
      }));
    }

  }

  componentDidMount() {
    const containerElement = this.containerRef.current;
    if (!containerElement) return;

    // Using IntersectionObserver to prevent scrolling calculation when the entire container is out of viewport.
    this.intersectionObserver = new IntersectionObserver(entries => {
      if (entries.length !== 1) return;
      const entry = entries[0];
      const { isIntersecting } = entry;
      this.setState({ isIntersecting });
    }, {
      threshold: 0,
    });
    this.intersectionObserver.observe(containerElement);

    // Using ResizeObserver because we should update some grid properties(e.g. the num of cells per 1 row) when the container element is resized.
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length !== 1) return;
      const entry = entries[0];
      const { contentRect: { width } } = entry;
      if (this.previousContainerWidth !== width) {
        this.updateContainerState(width);
      }
      this.previousContainerWidth = width;
    });
    this.resizeObserver.observe(containerElement);

    document.addEventListener('scroll', this.handleOnScroll);

    // Listen to URL hash and update scrolling position if it's changed.
    window.addEventListener('hashchange', this.handleOnHashChange);

    this.previousContainerWidth = containerElement.clientWidth;

    // Initialize grid information
    this.updateContainerState(containerElement.clientWidth);
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleOnScroll);
    window.removeEventListener('hashchange', this.handleOnHashChange);
    this.intersectionObserver && this.intersectionObserver.disconnect();
    this.resizeObserver && this.resizeObserver.disconnect();
  }

  // This function should be invoked when the container element is resized.
  private updateContainerState(containerWidth: number) {
    const { cellHeight } = this.props;
    const { gridStyle, repeatLength } = this.getGridDefinition(containerWidth);
    const rowHeight = cellHeight + gridStyle.gridGap;
    const allItemsCount = this.props.items.length;
    const containerHeight = Math.ceil(allItemsCount / repeatLength) * rowHeight - gridStyle.gridGap;
    const visibleItemsLength = (~~(document.scrollingElement!.clientHeight / (this.props.cellHeight + gridStyle.gridGap)) + 2 + prerenderRowsLength) * repeatLength;
    this.setState({ containerHeight, repeatLength, visibleItemsLength, gridStyle });

    // For direct landing using URL with hash
    if (!this.context.consumed) {
      const hit = this.calculatePositionFromHash(this.context.hash);
      if (hit) {
        // Notify scrolling to the context because we should not check the hash after the scrolling.
        this.context.consume();
        this.setState({ offsetIndex: hit.offsetIndex });
        setTimeout(() => scrollTo(0, this.calculateClientOffsetTop(hit.offsetIndex)));
        return;
      }
    }

    requestAnimationFrame(() => this.updateCurrentOffsetIndex());
  }

  private getGridDefinition(containerWidth: number) {
    let matched: GridStyleProperty | undefined;
    this.gridProperties.some(({ media, prop }) => {
      matched = prop;
      return media.matches;
    });
    if (!matched) throw new Error('No matched media');
    const { gridGap, minContentLength } = matched;
    const repeatLength = minContentLength ? ~~((containerWidth + gridGap) / (minContentLength + gridGap)) : 1;
    const gridStyle = createGridStyleObject(matched);
    return { gridStyle, repeatLength, gridGap };
  }

  private calculatePositionFromHash(hash: string) {
    const { keyFn } = this.props;
    const targetName = hash.slice(1);
    const foundIndex = this.props.items.findIndex(item => keyFn(item) === targetName);
    if (foundIndex === -1) return;
    return {
      offsetIndex: foundIndex,
    };
  }

  private handleOnHashChange({ newURL }: HashChangeEvent) {
    const { hash } = new URL(newURL)
    const hit = this.calculatePositionFromHash(hash);
    if (!hit) return;
    animateScroll.scrollTo(this.calculateClientOffsetTop(hit.offsetIndex));
  }

  private handleOnScroll() {
    if (!this.state.isIntersecting) return;
    this.updateCurrentOffsetIndex();
  };

  private updateCurrentOffsetIndex() {
    const containerElement = this.containerRef.current;
    if (!containerElement) return;
    const cot = containerElement.offsetTop;
    const sst = document.scrollingElement!.scrollTop;
    const deltaY = sst - cot;
    const nextOffsetIndex = ~~(deltaY / this.rowHeightUnit) * this.state.repeatLength;
    if (nextOffsetIndex >= 0 && this.state.offsetIndex !== nextOffsetIndex) {
      this.setState({ offsetIndex: nextOffsetIndex });
    }
  }

  private sliceVisibleItems() {
    const { offsetIndex, visibleItemsLength } = this.state;
    return this.props.items.slice(offsetIndex, visibleItemsLength + offsetIndex);
  }

  private get rowHeightUnit() {
    const { cellHeight } = this.props;
    const { gridStyle: { gridGap } } = this.state;
    return cellHeight + gridGap;
  }

  private calculateInnerOffsetTop(offsetIndex: number) {
    const { repeatLength } = this.state;
    return ~~(offsetIndex  / repeatLength) * this.rowHeightUnit;
  }

  private calculateClientOffsetTop(offsetIndex: number) {
    if (!this.containerRef.current) return 0;
    return this.calculateInnerOffsetTop(offsetIndex) + this.containerRef.current.offsetTop;
  }

  render() {
    const { children, keyFn, cellHeight } = this.props;
    const { containerHeight } = this.state;
    const offsetTop = this.calculateInnerOffsetTop(this.state.offsetIndex);
    const containerStyle = {
      position: 'relative',
      height: containerHeight,
    } as const;
    const innerStyle = {
      ...this.state.gridStyle,
      top: offsetTop,
    };
    return (
      <div ref={this.containerRef} style={containerStyle}>
        <ul style={innerStyle}>
          {this.sliceVisibleItems().map(item => (
            <li key={keyFn(item)} style={{ height: cellHeight }}>
              {children({ item })}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
