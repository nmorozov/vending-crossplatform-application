import electron from 'electron';
import React, { Component } from 'react';

import Tappable from 'react-tappable';

import Modal from 'react-modal';

import { Translate } from 'react-redux-i18n';

// Prop Types
import PropTypes from 'prop-types';

// Redux
import { connect } from 'react-redux';
import { navigateTo } from '../../store/actions/router_actions';
import { selectCoinBackSide } from '../../store/actions/cart_actions';

// Constants
import {
  MAGNETIC_CASE_SELECT,
  HOME,
} from '../../store/constants/routeConstants';

import coinFrontSideTypes from '../../types/coinFrontSideTypes';

import imageFile from '../../utils/imageFile';

import styles from './Signature.scss';

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

class Signature extends Component {
  static propTypes = {
    navigateTo: PropTypes.func.isRequired,
    selectCoinBackSide: PropTypes.func.isRequired,
    coinFrontSide: coinFrontSideTypes.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      canvasIsEmpty: true,
      drawMode: false,
      idleTimerLeft: app.config.idleTime,
      idleTimerLeftSmall: 10,
      lastTime: false,
      modalIsOpen: false,
    };
    app.log('---> Signature <---');
    electron.remote.app.monitoring.currentPage = 'Signature';
  }

  componentWillMount() {
    this.fillCoinBackgroundText();
  }

  componentDidMount() {
    this.initCanvas();
    this.initHiddenCanvas();
    this.initIdleTimer();
  }

  componentWillUnmount() {
    clearInterval(this.idleTimer);
    clearInterval(this.idleTimerSmall);
  }

  canvas = null;
  ctx = null;
  flag = false;
  prevX = 0;
  currX = 0;
  prevY = 0;
  currY = 0;
  dotFlag = false;

  x = 'black';
  y = 8;

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

  goToMagneticCaseSelect = () => {
    let fWidth = app.config.frontsideImageWidth;
    let fHeight = app.config.frontsideImageHeight;

    this.hiddenCTX.drawImage(
      this.ctx.canvas,
      150,
      150,
      fWidth - 300,
      fHeight - 300
    );
    this.hiddenCTX.drawImage(
      this.coinBackgroundText,
      0,
      0,
      fWidth - 0,
      fHeight - 0
    );

    let base64 = this.hiddenCanvas.toDataURL('image/png');
    const imageFilePath = imageFile.save(
      `${Date.now()}.png`,
      base64
    );

    let image = base64.replace(/^data:image\/\w+;base64,/, '');
    image = new Buffer(image, 'base64');

    this.props.selectCoinBackSide({ name: 'signature', image: image, path: imageFilePath, imageBase64: base64 });
    this.props.navigateTo(MAGNETIC_CASE_SELECT);
  };

  initCanvas = () => {
    this.canvas = document.getElementById('can');
    this.ctx = this.canvas.getContext('2d');
    this.w = this.canvas.width;
    this.h = this.canvas.height;

    let w = this.canvas.width / 2;
    let h = this.canvas.height / 2;
    let circle = this.ctx.ellipse(w, h, w, h, 0, 0, 360);
    this.ctx.clip(circle);

    // Touch events
    this.canvas.addEventListener(
      'touchmove',
      e => {
        this.findxyTouch('move', e);
        e.preventDefault();
      },
      false
    );
    this.canvas.addEventListener(
      'touchstart',
      e => {
        this.findxyTouch('down', e);
        e.preventDefault();
      },
      false
    );
    this.canvas.addEventListener(
      'touchend',
      e => {
        this.findxyTouch('up', e);
        e.preventDefault();
      },
      false
    );

    // mouse
    this.canvas.addEventListener(
      'mousemove',
      e => {
        this.findxy('move', e);
      },
      false
    );
    this.canvas.addEventListener(
      'mousedown',
      e => {
        this.findxy('down', e);
      },
      false
    );
    this.canvas.addEventListener(
      'mouseup',
      e => {
        this.findxy('up', e);
      },
      false
    );
    this.canvas.addEventListener(
      'mouseout',
      e => {
        this.findxy('out', e);
      },
      false
    );
  };

  draw = () => {
    this.ctx.beginPath();
    this.ctx.moveTo(this.prevX, this.prevY);
    this.ctx.lineTo(this.currX, this.currY);
    this.ctx.strokeStyle = this.x;
    this.ctx.lineWidth = this.y;
    this.ctx.stroke();
    this.ctx.closePath();
  };

  erase = () => {
    let fWidth = app.config.frontsideImageWidth;
    let fHeight = app.config.frontsideImageHeight;

    this.ctx.clearRect(0, 0, this.w, this.h);
    this.hiddenCTX.clearRect(
      0,
      0,
      fWidth,
      fHeight
    );
    this.setState({ canvasIsEmpty: true });
  };

  findxy = (res, e) => {
    if (this.state.drawMode === false) return;

    if (res === 'down') {
      this.prevX = this.currX;
      this.prevY = this.currY;
      this.currX = (e.clientX - this.canvas.getBoundingClientRect().left) * 2;
      this.currY = (e.clientY - this.canvas.getBoundingClientRect().top) * 2;

      this.flag = true;
      this.dot_flag = true;
      if (this.dot_flag) {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.x;
        this.ctx.fillRect(this.currX, this.currY, 2, 2);
        this.ctx.closePath();
        this.dot_flag = false;
      }
    }
    if (res === 'up' || res === 'out') {
      this.flag = false;
    }
    if (res === 'move') {
      if (this.flag) {
        this.prevX = this.currX;
        this.prevY = this.currY;
        this.currX = (e.clientX - this.canvas.getBoundingClientRect().left) * 2;
        this.currY = (e.clientY - this.canvas.getBoundingClientRect().top) * 2;
        this.draw();
      }
    }

    this.setState({ canvasIsEmpty: false });
  };

  findxyTouch = (res, e) => {
    if (this.state.drawMode === false) return;
    if (e.touches) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];

        if (res === 'down') {
          this.prevX = this.currX;
          this.prevY = this.currY;
          this.currX = (touch.clientX - this.canvas.getBoundingClientRect().left) * 2;
          this.currY = (touch.clientY - this.canvas.getBoundingClientRect().top) * 2;

          this.flag = true;
          this.dot_flag = true;
          if (this.dot_flag) {
            this.ctx.beginPath();
            this.ctx.fillStyle = this.x;
            this.ctx.fillRect(this.currX, this.currY, 2, 2);
            this.ctx.closePath();
            this.dot_flag = false;
          }
        }
        if (res === 'up' || res === 'out') {
          this.flag = false;
        }
        if (res === 'move') {
          if (this.flag) {
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = (touch.clientX - this.canvas.getBoundingClientRect().left) * 2;
            this.currY = (touch.clientY - this.canvas.getBoundingClientRect().top) * 2;
            this.draw();
          }
        }
      }
    }

    this.setState({ canvasIsEmpty: false });
  };

  idleTimer;
  idleTimerSmall;
  enabledDrawTimer;


  initIdleTimer = () => {
    if (!app.config.enabledDrawTime){
      this.enabledDrawTimer = setTimeout(() => this.setState({ drawMode: true }), 200);
    }
    else {
      this.enabledDrawTimer = setTimeout(() => this.setState({ drawMode: true }), app.config.enabledDrawTime);
      }
    this.idleTimer = setInterval(this.idleTimerTick, 1000);
  };

  idleTimerTick = () => {
    let { idleTimerLeft } = this.state;
    this.setState({ drawMode: true });

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

  openModal = () => {
    this.flag = false;
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
    this.setState({ modalIsOpen: false});
    clearInterval(this.idleTimerSmall);
    clearInterval(this.idleTimer);
    // this.props.navigateTo(HOME, true);
    let fWidth = app.config.frontsideImageWidth;
    let fHeight = app.config.frontsideImageHeight;

    this.hiddenCTX.drawImage(
      this.ctx.canvas,
      150,
      150,
      fWidth - 300,
      fHeight - 300
    );
    this.hiddenCTX.drawImage(
      this.coinBackgroundText,
      0,
      0,
      fWidth - 0,
      fHeight - 0
    );

    let base64 = this.hiddenCanvas.toDataURL('image/png');
    const imageFilePath = imageFile.save(
      `${Date.now()}.png`,
      base64
    );

    let image = base64.replace(/^data:image\/\w+;base64,/, '');
    image = new Buffer(image, 'base64');

    this.props.selectCoinBackSide({ name: 'signature', image: image, path: imageFilePath, imageBase64: base64 });
    this.props.navigateTo(MAGNETIC_CASE_SELECT);
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
    const className = this.state.canvasIsEmpty
      ? `${styles.button} ${styles.confirm} ${styles.disabled}`
      : `${styles.button} ${styles.confirm}`;
    const onClik = this.state.canvasIsEmpty
      ? null
      : this.goToMagneticCaseSelect;
    return (
      <Tappable component="div" className={className} onTouchEnd={onClik} tabIndex={-2} role="button">
        <Translate value="confirm" />
      </Tappable>
    );
  };

  renderEraseButton = () => {
    const className =
      this.state.canvasIsEmpty || this.state.drawMode === false
        ? `${styles.button} ${styles.erase} ${styles.disabled}`
        : `${styles.button} ${styles.erase}`;
    const onClik = this.state.canvasIsEmpty ? null : this.erase;
    return (
      <Tappable component="div" className={className} onTouchEnd={onClik} tabIndex={-3} role="button">
        <Translate value="erase" />
      </Tappable>
    );
  };

  render() {
    let fWidth = app.config.frontsideImageWidth;
    let fHeight = app.config.frontsideImageHeight;

    return (
      <div className={styles.wrapper}>
        <canvas
          className={styles.hiddenCanvas}
          id="hiddenCanvas"
          width={fWidth}
          height={fHeight}
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
          <div className={styles.timerDescriptionText}>
            <Translate value="putYourSignatureOrDrawAPicture" />
          </div>
          <div className={styles.interactiveAreaWrapper}>
            <div className={styles.backgroundImageStyle}>
              <div className={styles.backgroundTextStyle} style={{backgroundImage: `url(${this.props.coinFrontSide && this.props.coinFrontSide.clientImage})`}}>
                <canvas
                  className={styles.canvas}
                  id="can"
                  width="720"
                  height="720"
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

const actions = { navigateTo, selectCoinBackSide };

function mapStateToProps(state) {
  return {
    coinFrontSide: state.cartReducer.toJS().coinFrontSide,
  };
}

export default connect(
  mapStateToProps,
  actions
)(Signature);
