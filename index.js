import React, {
  Component,
  PropTypes,
} from 'react';

import {
  ActivityIndicatorIOS,
  ProgressBarAndroid,
  Image,
  View,
  StyleSheet,
  Platform,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const DefaultIndicator = Platform.OS === 'android' ? ProgressBarAndroid : ActivityIndicatorIOS;

class ImageProgress extends Component {
  static propTypes = {
    indicator: PropTypes.func,
    indicatorProps: PropTypes.object,
    renderIndicator: PropTypes.func,
    threshold: PropTypes.number,
    loadThreshold: PropTypes.number,
    loadErrorIndicator: PropTypes.node,
  };

  static defaultProps = {
    threshold: 50,
    loadThreshold: 10000,
  };

  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      progress: 0,
      thresholdReached: !props.threshold,
      loadThresholdReached: !props.loadThresholdReached,
    };
  }

  componentDidMount() {
    if (this.props.threshold) {
      this._thresholdTimer = setTimeout(() => {
        this.setState({ thresholdReached: true });
        this._thresholdTimer = null;
      }, this.props.threshold);
    }
    if (this.props.loadThresholdReached) {
      this._loadThresholdTimer = setTimeout(() => {
        this.setState({ loadThresholdReached: true });
        this._loadThresholdTimer = null;
      }, this.props.loadThresholdReached);
    }
  }

  componentWillUnmount() {
    if (this._thresholdTimer) {
      clearTimeout(this._thresholdTimer);
    }
    if (this._loadThresholdTimer) {
      clearTimeout(this._loadThresholdTimer);
    }
  }

  componentWillReceiveProps(props) {
    if (!this.props.source || !props.source || this.props.source.uri !== props.source.uri) {
      this.setState({
        loading: false,
        progress: 0,
      });
    }
  }

  setNativeProps(nativeProps) {
    if (this._root) {
      this._root.setNativeProps(nativeProps);
    }
  }

  bubbleEvent(propertyName, event) {
    if (typeof this.props[propertyName] === 'function') {
      this.props[propertyName](event);
    }
  }

  handleLoadStart = () => {
    if (!this.state.loading && this.state.progress !== 1) {
      this.setState({
        loading: true,
        progress: 0,
      });
    }
    this.bubbleEvent('onLoadStart');
  };

  handleProgress = (event) => {
    const progress = event.nativeEvent.loaded / event.nativeEvent.total;
    // RN is a bit buggy with these events, sometimes a loaded event and then a few
    // 100% progress – sometimes in an infinite loop. So we just assume 100% progress
    // actually means the image is no longer loading
    if (progress !== this.state.progress && this.state.progress !== 1) {
      this.setState({
        loading: progress < 1,
        progress: progress,
      });
    }
    this.bubbleEvent('onProgress', event);
  };

  handleError = (event) => {
    this.setState({
      loading: false,
      loadThresholdReached: true,
    });
    this.bubbleEvent('onError', event);
  };

  handleLoad = (event) => {
    if (this.state.progress !== 1) {
      this.setState({
        loading: false,
        progress: 1,
      });
    }
    this.bubbleEvent('onLoad', event);
  };

  render() {
    const { indicator, indicatorProps, renderIndicator, threshold, loadErrorIndicator, ...props } = this.props;
    const { progress, thresholdReached, loading, loadThresholdReached } = this.state;

    let style = this.props.style;
    let children = this.props.children;
    let progressContent = null;

    if ((loading || progress < 1) && thresholdReached) {
      style = style ? [styles.container, style] : styles.container;
      if (renderIndicator) {
        progressContent = renderIndicator(progress, !loading || !progress);
      } else {
        const IndicatorComponent = (typeof indicator === 'function' ? indicator : DefaultIndicator);
        progressContent = (<IndicatorComponent progress={progress} indeterminate={!loading || !progress} {...indicatorProps} />);
      }

      if (loadThresholdReached && loadErrorIndicator) {
        progressContent = loadErrorIndicator
      }
    }
    return (
      <Image
        {...props}
        ref={component => { this._root = component; }}
        style={style}
        onLoadStart={this.handleLoadStart}
        onProgress={this.handleProgress}
        onError={this.handleError}
        onLoad={this.handleLoad}
      >
        {progressContent}
        {children}
      </Image>
    );
  }
}

module.exports = ImageProgress;
