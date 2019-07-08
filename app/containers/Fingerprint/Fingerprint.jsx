const gm = require('gm').subClass({imageMagick: true});

import path from 'path';
import ch from 'child_process';
import electron from 'electron';
import React, { Component } from 'react';

import Tappable from 'react-tappable';

import Modal from 'react-modal';

import { Translate } from 'react-redux-i18n';

// Redux
import { connect } from 'react-redux';
import { navigateTo } from '../../store/actions/router_actions';
import { selectCoinBackSide } from '../../store/actions/cart_actions';

// Prop types
import PropTypes from 'prop-types';

import imageFile from '../../utils/imageFile';
import imgClock from './images//clock.png';
import hintPng from './images//arrow.png';
// Router
import { goBack } from 'connected-react-router';

import {
  applyBlurToHeader,
  clearBlurFromHeader,
} from '../../utils/domElementStyler';

import styles from './Fingerprint.scss';

// Constants
import {
  MAGNETIC_CASE_SELECT,
  HOME,
} from '../../store/constants/routeConstants';

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

class Fingerprint extends Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      userAgreementPopupOpen: false,
      userAgreementAccepted: false,
      finger: "",
      idleTimerLeft: app.config.idleTime,
      idleTimerLeftSmall: 10,
      modalIsOpen: false
    };
  }

  goBack = () => {
    this.props.dispatch(goBack());
    app.log('---> Fingerprint <---');
    electron.remote.app.monitoring.currentPage = 'Fingerprint';

  };

  componentWillMount() {
    this.checkFinger();
    this.fillCoinBackgroundText();
  }

  componentDidMount() {
    this.initHiddenCanvas();
    this.initIdleTimer();
    this.mounted = true;
  }

  componentWillUnmount() {
    clearInterval(this.idleTimer);
    clearInterval(this.idleTimerSmall);
    if (this.execFinger) this.execFinger.kill();
    this.mounted = false;
  }

  checkFinger() {
    app.fingerprint(10000)
      .then(buffer => {
        if (buffer)
          this.setState({finger: `data:image/png;base64,${buffer.toString('base64')}`});
      })
      .catch(e => {
        app.error(e);
        if (this.mounted) {
          setTimeout(() => this.checkFinger(), 1000);
        }
      });
  }

  hiddenCanvas = null;
  hiddenCTX = null;

  coinBackgroundText;

  initHiddenCanvas = () => {
    this.hiddenCanvas = document.getElementById('hiddenCanvas');
    this.hiddenCTX = this.hiddenCanvas.getContext('2d');
  };

  fillCoinBackgroundText = () => {
    this.coinBackgroundText = new Image();
    this.coinBackgroundText.src = this.props.coinFrontSide.clientImage;
    this.coinBackgroundText.width = app.config.frontsideImageWidth;
    this.coinBackgroundText.height = app.config.frontsideImageHeight;
  };

  nextButtonClick = () => {
    let finger = new Image();
    finger.src = this.state.finger;
    finger.width = 192;
    finger.height = 192;

    this.hiddenCTX.drawImage(
      finger,
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

    this.props.selectCoinBackSide({ name: 'fingerprint', image: image, path: imageFilePath, imageBase64: base64 });
    this.props.navigateTo(MAGNETIC_CASE_SELECT);
  }

  idleTimer;
  idleTimerSmall;

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

  toggleUserAgrementPopup = () => {
    this.setState({
      userAgreementPopupOpen: !this.state.userAgreementPopupOpen,
    });

    if (this.state.userAgreementPopupOpen === false) {
      applyBlurToHeader();
    } else {
      clearBlurFromHeader();
    }
  };

  renderUserAgreementPopup = () => {
    const className = this.state.userAgreementPopupOpen
      ? styles.Overlay
      : `${styles.Overlay} ${styles.displayNone}`;
    return (
      <div className={className}>
        <div className={styles.UserAgreementPopupWrapper}>
          <div className={styles.InternalPopupContent}>
            <Translate
              className={styles.UserAgreementTitle}
              value="agreementOnProcessingOfPersonalBiometricDataOfUser"
            />
            <div className={styles.UserAgreementTextContainer}>
              <div className={styles.UserAgreementText}>
                <Translate
                  value="agreementOnProcessingOfPersonalBiometricDataOfUserText"
                  dangerousHTML
                />
              </div>
            </div>
            <Tappable
              onTouchEnd={this.toggleUserAgrementPopup}
              role="Button"
              tabIndex={-1}
              className={styles.confirm}
              component="div"
            >
              <Translate value="return" />
            </Tappable>
          </div>
        </div>
      </div>
    );
  };

  erase = () => {
    this.setState({ finger: '' });
    this.checkFinger();
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
    this.props.navigateTo(HOME, true);
  };

  renderConfirmButton = () => {
    const className =
      !this.state.finger
        ? `${styles.button} ${styles.confirm} ${styles.disabled}`
        : `${styles.button} ${styles.confirm}`;
    const onClik =
      // TO DO Insert go to magnetic case
      !this.state.finger ? null : this.nextButtonClick;
    return (
      <Tappable component="div" className={className} onTouchEnd={onClik} tabIndex={-2} role="button">
        <Translate value="confirm" />
      </Tappable>
    );
  };

  renderEraseButton = () => {
    const className =
      !this.state.finger
        ? `${styles.button} ${styles.erase} ${styles.disabled}`
        : `${styles.button} ${styles.erase}`;
    const onClik = !this.state.finger ? null : this.erase;
    return (
      <Tappable component="div" className={className} onTouchEnd={onClik} tabIndex={-3} role="button">
        <Translate value="erase" />
      </Tappable>
    );
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

  render() {
    const failedFingerprint =
      process.env.NODE_ENV === 'production'
        ? './dist/images/failed_fingerprint.png'
        : './images/failed_fingerprint.png';
    const hintGif = './dist/video/gifka.gif';
    // const hintPng = app.imagesPath + '/images/arrow.png';
    return (
      <div className={styles.wrapper}>
        <canvas
          className={styles.hiddenCanvas}
          id="hiddenCanvas"
          width={app.config.frontsideImageWidth}
          height={app.config.frontsideImageHeight}
        />
        {this.renderUserAgreementPopup()}
        <div className={styles.title}>
          <div className={styles.number}>2</div>
          <div className={styles.description}>
            <Translate value="chooseTheWayOfTheBackSidePersonalization" />
          </div>
        </div>
        <div className={styles.popupWrapper}>
          <div className={styles.backgroundImageStyle}>
            <div className={styles.backgroundTextStyle} style={{backgroundImage: `url(${this.props.coinFrontSide && this.props.coinFrontSide.clientImage})`}}>
              <img src={this.state.finger || failedFingerprint} alt={"fingerprint status"} height={120} />
            </div>
          </div>
          <div className={styles.instruction}>
            <Translate value="attachAFingerToTheSensor" />
          </div>
          <div className={styles.wait5SecondsBlock}>
            <Translate value="wait5Seconds" />
            <img src={imgClock} alt="imgClock"/>
          </div>
          <div className={styles.userAgreementBlock}>
            <Translate
              className={styles.userAgreementText}
              value="iAcceptTheTermsAndConditions"
            />
            <Tappable
              className={styles.userAgreementLink}
              role="Button"
              tabIndex={-2}
              onTouchEnd={this.toggleUserAgrementPopup}
            >
              <Translate value="personalDataAgreements" />
            </Tappable>
          </div>
          <div className={styles.buttons}>
            <Tappable
              className={styles.return}
              onTouchEnd={this.goBack}
              role="Button"
              tabIndex={-1}
              component="div"
            >
              <Translate value="return" />
            </Tappable>
            {this.renderConfirmButton()}
            {this.renderEraseButton()}
          </div>
        </div>
        {/*<div className={styles.hint}>
          <img className={styles.hint.gif} src={hintGif} alt="hint" />
        </div>*/}
        {<div className={styles.hint}>
            <img className={styles.hint.img} src={hintPng} alt="hint" />
          </div>
        }
        {this.renderModal()}
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    navigateTo: (page) => dispatch(navigateTo(page)),
    selectCoinBackSide: (params) => dispatch(selectCoinBackSide(params))
  };
}

function mapStateToProps(state) {
  return {
    coinFrontSide: state.cartReducer.toJS().coinFrontSide,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Fingerprint);
