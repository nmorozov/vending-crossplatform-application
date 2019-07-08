import electron from 'electron';
import React, { Component } from 'react';

import Tappable from 'react-tappable';

import Modal from 'react-modal';

import { Translate } from 'react-redux-i18n';

// Prop Types
import PropTypes from 'prop-types';

import KeyboardedInput from 'react-touch-screen-keyboard';
import 'react-touch-screen-keyboard/lib/Keyboard.css';

// Redux
import { connect } from 'react-redux';
import { navigateTo } from '../../store/actions/router_actions';
import { selectCoinBackSide } from '../../store/actions/cart_actions';

// Constants
import {
  MAGNETIC_CASE_SELECT,
  HOME,
} from '../../store/constants/routeConstants';

import imageFile from '../../utils/imageFile';

import coinFrontSideTypes from '../../types/coinFrontSideTypes';

import styles from './Text.scss';

const app = electron.remote.app;

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    border: 'none',
    boxShadow: '0 24px 47px 0 rgba(0, 0, 0, 0.4)',
    borderRadius: '10px',
    textAlign: 'center',
  },
};

class Text extends Component {
  static propTypes = {
    navigateTo: PropTypes.func.isRequired,
    selectCoinBackSide: PropTypes.func.isRequired,
    coinFrontSide: coinFrontSideTypes.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      text: '',
      idleTimerLeft: app.config.idleTime,
      idleTimerLeftSmall: app.config.idleTime,
      textInputEnabled: true,
      lastTime: false,
      modalIsOpen: false,
    };
    app.log('---> Text <---');
    electron.remote.app.monitoring.currentPage = 'Text';
  }

  componentWillMount() {
    this.fillCoinBackgroundText();
  }

  componentDidMount() {
    this.initCanvas();
    this.initHiddenCanvas();
    this.initIdleTimer();

    this.inputText.focus();
  }

  componentWillUnmount() {
    clearInterval(this.idleTimer);
    clearInterval(this.idleTimerSmall);
  }

  tCtx;
  canvas;
  idleTimer;
  idleTimerSmall;

  hiddenCanvas = null;
  hiddenCTX = null;

  coinBackgroundText;

  fillCoinBackgroundText = () => {
    this.coinBackgroundText = new Image();
    this.coinBackgroundText.src = this.props.coinFrontSide.clientImage;
    this.coinBackgroundText.width = app.config.frontsideImageWidth;
    this.coinBackgroundText.height = app.config.frontsideImageHeight;
  };

  initHiddenCanvas = () => {
    this.hiddenCanvas = document.getElementById('hiddenCanvas');
    this.hiddenCTX = this.hiddenCanvas.getContext('2d');
  };

  initIdleTimer = () => {
    this.idleTimer = setInterval(this.idleTimerTick, 1000);
  };

  idleTimerTick = () => {
    let { idleTimerLeft } = this.state;

    if (idleTimerLeft === 0) {
      this.openModal();
      return;
    }

    this.setState({ idleTimerLeft: (idleTimerLeft -= 1) });
  };

  initIdleTimerSmall = () => {
    this.idleTimerSmall = setInterval(this.idleTimerTickSmall, 1000);
  };

  idleTimerTickSmall = () => {
    let { idleTimerLeftSmall } = this.state;

    if (idleTimerLeftSmall === 0) {
      this.props.navigateTo(HOME, true);
      return;
    }

    this.setState({ idleTimerLeftSmall: (idleTimerLeftSmall -= 1) });
  };

  goToMagneticCaseSelect = () => {
    this.hiddenCTX.drawImage(
      this.tCtx.canvas,
      150,
      150,
      app.config.frontsideImageWidth - 300,
      app.config.frontsideImageHeight - 300
    );
    this.hiddenCTX.drawImage(
      this.coinBackgroundText,
      0,
      0,
      app.config.frontsideImageWidth - 0,
      app.config.frontsideImageHeight - 0
    );

    let base64 = this.hiddenCanvas.toDataURL('image/png');
    const imageFilePath = imageFile.save(
      `${Date.now()}.png`,
      base64
    );

    let image = base64.replace(/^data:image\/\w+;base64,/, '');
    image = new Buffer(image, 'base64');

    this.props.selectCoinBackSide({ name: 'text', image: image, path: imageFilePath, imageBase64: base64 });
    this.props.navigateTo(MAGNETIC_CASE_SELECT);
  };

  initCanvas = () => {
    this.canvas = document.getElementById('can');
    this.tCtx = this.canvas.getContext('2d');
    this.tCtx.font = 'bold 96px Time New Roman';
    this.tCtx.textAlign = 'center';
    this.tCtx.textBaseline = 'middle';
    this.w = this.canvas.width;
    this.h = this.canvas.height;

    let w = this.canvas.width / 2;
    let h = this.canvas.height / 2;
    let circle = this.tCtx.ellipse(w, h, w, h, 0, 0, 360);
    this.tCtx.clip(circle);
  };

  erase = () => {
    this.tCtx.clearRect(0, 0, this.w, this.h);
    this.hiddenCTX.clearRect(
      0,
      0,
      app.config.frontsideImageWidth,
      app.config.frontsideImageHeight
    );
  };

  handleTextChange = text => {
    if (text.length > this.state.text.length && this.state.text.length === 8) {
      return;
    }

    this.erase();
    this.setState({ text });
    let path = this.tCtx.fillText(text, 180, 180);
  };

  openModal = () => {
    this.setState({ modalIsOpen: true, idleTimerLeftSmall: 10 });
    clearInterval(this.idleTimer);
    this.initIdleTimerSmall();
  };

  closeModalYes = () => {
    this.setState({ modalIsOpen: false, idleTimerLeft: app.config.idleTime });
    clearInterval(this.idleTimerSmall);
    this.initIdleTimer();
  };

  closeModalNo = () => {
    this.setState({ modalIsOpen: false });
    clearInterval(this.idleTimerSmall);
    clearInterval(this.idleTimer);

    this.hiddenCTX.drawImage(
      this.tCtx.canvas,
      150,
      150,
      app.config.frontsideImageWidth - 300,
      app.config.frontsideImageHeight - 300
    );
    this.hiddenCTX.drawImage(
      this.coinBackgroundText,
      0,
      0,
      app.config.frontsideImageWidth - 0,
      app.config.frontsideImageHeight - 0
    );

    let base64 = this.hiddenCanvas.toDataURL('image/png');
    const imageFilePath = imageFile.save(
      `${Date.now()}.png`,
      base64
    );

    let image = base64.replace(/^data:image\/\w+;base64,/, '');
    image = new Buffer(image, 'base64');

    this.props.selectCoinBackSide({ name: 'text', image: image, path: imageFilePath, imageBase64: base64 });
    this.props.navigateTo(MAGNETIC_CASE_SELECT);

    // this.props.navigateTo(HOME, true);
  };

  renderModal = () => (
    <Modal
      isOpen={this.state.modalIsOpen}
      onRequestClose={this.closeModalYes}
      shouldCloseOnOverlayClick={false}
      style={customStyles}
    >
      <div>
        <Translate value="youEnd" />
      </div>
      <div>
        <Tappable component="div" className={styles.confirmYes} onTouchEnd={this.closeModalYes}>
          <Translate value="yes" />
        </Tappable>
        <Tappable component="div" className={styles.confirmNo} onTouchEnd={this.closeModalNo}>
          <Translate value="no" />
        </Tappable>
      </div>
    </Modal>
  );

  renderConfirmButton = () => {
    const className =
      this.state.text.length === 0
        ? `${styles.button} ${styles.confirm} ${styles.disabled}`
        : `${styles.button} ${styles.confirm}`;
    const onClik =
      this.state.text.length === 0 ? null : this.goToMagneticCaseSelect;
    return (
      <Tappable component="div" className={className} onTouchEnd={onClik} tabIndex={-2} role="button">
        <Translate value="confirm" />
      </Tappable>
    );
  };

  renderEraseButton = () => {
    const className =
      this.state.text.length === 0 || this.state.textInputEnabled === false
        ? `${styles.button} ${styles.erase} ${styles.disabled}`
        : `${styles.button} ${styles.erase}`;
    const onClik = this.state.canvasIsEmpty
      ? null
      : () => {
          this.setState({ text: '' });
          this.erase();
        };
    return (
      <Tappable component="div" className={className} onTouchEnd={onClik} tabIndex={-3} role="button">
        <Translate value="erase" />
      </Tappable>
    );
  };

  render() {
    const placeholder =
      process.env.NODE_ENV === 'production'
        ? './dist/images/coin_bg_plain.png'
        : './images/coin_bg_plain.png';

    const backgroundImageStyle = {
      backgroundImage: `url(${placeholder})`,
      backgroundSize: '483px 483px',
      width: '483px',
      height: '483px',
      margin: '0 auto',
      position: 'relative',
    };

    const backgroundTextStyle = {
      backgroundImage: `url(${this.props.coinFrontSide && this.props.coinFrontSide.clientImage})`,
      backgroundSize: '483px 483px',
      width: '483px',
      height: '483px',
      position: 'relative',
      backgroundPosition: '0 0px',
    };

    let locale = this.props.locale;
    locale = locale == 'en' ? 'us' : locale;
    locale = locale == 'zh' ? 'us' : locale;
    locale = locale == 'it' ? 'us' : locale;
    locale = locale == 'he' ? 'us' : locale;
    locale = locale == 'es' ? 'us' : locale;
    locale = locale == 'fr' ? 'us' : locale;
    return (
      <div className={styles.wrapper}>
        <canvas
          className={styles.hiddenCanvas}
          id="hiddenCanvas"
          width={app.config.frontsideImageWidth}
          height={app.config.frontsideImageHeight}
        />
        <div className={styles.title}>
          <div className={styles.number}>2</div>
          <div className={styles.description}>
            <Translate value="chooseTheWayOfTheBackSidePersonalization" />
          </div>
        </div>
        <div className={styles.personalizationTypeWrapper}>
          <div className={styles.timerDescriptionText}>
            <Translate value="secondsLeft" />
          </div>
          <div className={styles.secondsLeftValue}>
            {this.state.idleTimerLeft}
          </div>
          <div
            className={`${styles.timerDescriptionText} ${
              styles.zeroMarginBottom
            }`}
          >
            <Translate value="yourOwnImprintOnAUniqueCoin" />
          </div>
          <div className={styles.timerDescriptionText}>
            <Translate value="maximum7Symbols" />
          </div>
          <div className={styles.interactiveAreaWrapper}>
            <div style={backgroundImageStyle}>
              <div style={backgroundTextStyle}>
                <canvas
                  className={styles.canvas}
                  id="can"
                  width="360"
                  height="360"
                />
                <KeyboardedInput
                  ref={ref => { this.inputText = ref; }}
                  enabled={this.state.textInputEnabled}
                  type="qwerty"
                  onChange={this.handleTextChange}
                  value={this.state.text}
                  maxLength="1"
                  name="textInput"
                  inputClassName={styles.textInput}
                  defaultKeyboard={locale}
                  isFirstLetterUppercase={false}
                  secondaryKeyboard="us" // optional
                  isDraggable={false} // optional, default is `true`
                  opacity={0.9} // optional
                />
              </div>
            </div>
          </div>
          <div className={styles.buttons}>
            {this.renderConfirmButton()}
            {this.renderEraseButton()}
          </div>
        </div>
        {this.renderModal()}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    locale: state.i18n.locale,
    coinFrontSide: state.cartReducer.toJS().coinFrontSide,
  };
}

const actions = { navigateTo, selectCoinBackSide };

export default connect(
  mapStateToProps,
  actions
)(Text);
