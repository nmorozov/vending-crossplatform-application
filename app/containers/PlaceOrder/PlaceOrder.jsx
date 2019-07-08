const gm = require('gm').subClass({ imageMagick: true });

import fs from 'fs';

import electron from 'electron';
import React, { Component } from 'react';

import Tappable from 'react-tappable';

import { Translate } from 'react-redux-i18n';

import Modal from 'react-modal';

import PropTypes from 'prop-types';

// Redux
import { connect } from 'react-redux';
import { navigateTo } from '../../store/actions/router_actions';
import { sendStat } from '../../store/actions/statistics';
import { setPayInfo } from '../../store/actions/cart_actions';

import styles from './PlaceOrder.scss';

import Logger from '../../utils/Logger';

// Constants
import {
  COIN_FRONT_SIDE_SELECT,
  HOME,
  UNKNOWN_ERROR,
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

Modal.setAppElement('#root');

class PlaceOrder extends Component {
  static propTypes = {
    navigateTo: PropTypes.func.isRequired,
  };
  constructor(props) {
    super(props);

    this.state = {
      score: 0,
      progressBarProgress: 0,
      gameTimeLeft: app.config.printTimeout,
      catHomeNumber: 0,
      catType: 1,
      modalIsOpen: false,
      game2: app.imagesPath +"/game/1.html"
    };

    this.startCountdownOrderTimer();
    this.startGame();
    const music = './dist/audio/music.wav';
    this.audio = new Audio(music);
    this.audio.play();
    this.audio.addEventListener('ended', () => {
      this.audio.currentTime = 0;
      this.audio.play();
    }, false);
    app.log('---> PlaceOrder <---');
    electron.remote.app.monitoring.currentPage = 'PlaceOrder';
  }

  componentWillUnmount() {
    this.gameTimer && clearInterval(this.gameTimer);
    this.countdownOrderTimer && clearInterval(this.countdownOrderTimer);
    this.audio && this.audio.pause();
  }

  async componentDidMount() {
    app.log('---> game2Patch=',this.state.game2);
    if (app.config.oneSide != 'client') {
      app.log('Process front image');
      app.config.currentPrinting = 1;
      // app.monitoring.lastPrinting = 1;
      //Logger.writeLine('Process front image');
      /*let frontImage = await new Promise((resolve, reject) => {
        gm(this.props.coinFrontSide.image, 'image.png')
        .transparent('#ffffff')
          .flatten()
          .fill('#ffffff')
          .units('PixelsPerInch')
          .density(720, 720)
          .resize(1050, 1050)
          .bitdepth(24)
          .toBuffer('BMP3', (err, buffer) => err ? reject(err) : resolve(buffer));
        });
        fs.writeFileSync(app.config.awersFile, frontImage);*/

      app.log('Process mask image');
      let maskImage = await new Promise((resolve, reject) => {
        let base64 = this.props.coinFrontSide.maskImageText.toDataURL('image/png');
        let image = base64.replace(/^data:image\/\w+;base64,/, '');
        image = new Buffer(image, 'base64');

        gm(image, 'mask.png')
          .transparent('#ffffff')
          .flatten()
          .fill('#ffffff')
          .units('PixelsPerInch')
          .density(360, 360)
          .resize(525, 525)
          .bitdepth(24)
          .toBuffer('BMP3', (err, buffer) => err ? reject(err) : resolve(buffer));
      });
      fs.writeFileSync(app.config.awersFile, maskImage);
    }

    if (app.config.oneSide != 'image') {
      app.log('Process back image');
      //Logger.writeLine('Process back image');
      let backImage = await new Promise((resolve, reject) => {
        gm(this.props.coinBackSide.image, 'imageFront.png')
          .transparent('#ffffff')
          .flatten()
          .fill('#ffffff')
          .rotate('white', 180)
          .units('PixelsPerInch')
          .density(720, 720)
          .resize(1050, 1050)
          .bitdepth(24)
          .toBuffer('BMP3', (err, buffer) => err ? reject(err) : resolve(buffer));
      });
      fs.writeFileSync(app.config.rewersFile, backImage);
    }

    let board = app.board;

    if (!app.config.disablePrinter) {
      try {
        //await board.print(app.config.awersFile, app.config.rewersFile, this.props.magneticCase.id);
        await board.print(
          app.config.oneSide != 'client' && this.props.coinFrontSide.path,
          app.config.oneSide != 'image' && app.config.rewersFile,
          app.config.oneSide != 'client' && app.config.awersFile,
          this.props.magneticCase.num || this.props.magneticCase.id
        );
        await board.awaitEvent('report_get_coin', 30000);

        this.props.setPayInfo({});

        if (app.config.oneSide != 'client') {
          sendStat('print_image', this.props.coinFrontSide.id);
        }
        if (app.config.oneSide != 'image') {
          sendStat('print_client_type', this.props.coinBackSide.name);
        }
        sendStat('print_envelope', this.props.magneticCase.id);

        // app.monitoring.lastPrinting = 0;
        app.config.currentPrinting = 0;
        app.config.nextDisablePayment = app.config.disablePayment;
        return this.props.navigateTo(HOME, true);
      } catch (e) {
        app.error(e);

        clearInterval(this.gameTimer);
        clearInterval(this.countdownOrderTimer);
        this.audio.pause();
        app.config.nextDisablePayment = app.config.disablePayment;
        return this.props.navigateTo(UNKNOWN_ERROR);
      }
    } else {
      setTimeout(async () => {
        // app.monitoring.lastPrinting = 0;
        app.config.currentPrinting = 0;
        this.props.setPayInfo({});
        this.props.navigateTo(HOME, true);
        // this.props.navigateTo(UNKNOWN_ERROR);
      }, 150000);
    }
  }

  getCatShowTime = () => {
    const { score } = this.state;

    if (typeof app.config.gameCatShowTime !== "undefined") {
      const game = app.config.gameCatShowTime;
      if (score >= game.count0 && score < game.count1) {
        return game.tim1;
      } else if (score >= game.count1 && score < game.count2) {
        return game.tim2;
      } else if (score >= game.count2 && score < game.count3) {
        return game.tim3;
      } else if (score >= game.count3) {
        return game.tim4;
      }
      return game.tim0;
    }
    else {
      if (score >= 30 && score < 50) {
        return 1500;
      } else if (score >= 50 && score < 80) {
        return 1000;
      } else if (score >= 80 && score < 110) {
        return 700;
      } else if (score >= 110) {
        return 300;
      }

      return 2000;
    }
  };

  // Modal methods

  openModal = () => {
    this.setState({ modalIsOpen: true });
  };

  closeModal = () => {
    this.setState({ modalIsOpen: false });
    this.props.navigateTo(HOME, true);
    this.audio.pause();
  };

  countdownOrderTimer;
  gameTimer;
  audio;

  startCountdownOrderTimer = () => {
    this.countdownOrderTimer = setInterval(this.countdownOrderTimerTick, 1000);
  };

  startGame = () => {
    this.gameTimer = setInterval(this.gameTimerTick, this.getCatShowTime());
  };

  stopGame = () => {
    clearInterval(this.gameTimer);
    this.setState({ modalIsOpen: true });
  };

  gameTimerTick = () => {
    this.relocateCat();
    this.changeCatType();
    clearInterval(this.gameTimer);
    this.gameTimer = setInterval(this.gameTimerTick, this.getCatShowTime());
  };

  relocateCat = () => {
    const catHomeNumber = Math.floor(Math.random() * 12);

    if (catHomeNumber === this.state.catHomeNumber) {
      return this.relocateCat();
    }
    return this.setState({ catHomeNumber });
  };

  changeCatType = () => {
    const catTypeNumber = Math.floor(Math.random() * 5);

    if (catTypeNumber === this.state.catType || catTypeNumber === 0) {
      return this.changeCatType();
    }
    return this.setState({ catType: catTypeNumber });
  };

  countdownOrderTimerTick = () => {
    let { gameTimeLeft } = this.state;

    if (this.processPage) {

      clearInterval(this.gameTimer);
      clearInterval(this.countdownOrderTimer);
      this.audio.pause();

      switch (this.processPage) {
        case 'error': return this.props.navigateTo(UNKNOWN_ERROR);
        case 'video': return this.props.navigateTo(HOME, true);
      }
    }

    if (gameTimeLeft === 0) {
      clearInterval(this.countdownOrderTimer);
      this.setState({
        progressBarProgress: this.recalculateProgressBarProgress(),
      });

      this.stopGame();

      return;
    }

    this.setState({
      gameTimeLeft: (gameTimeLeft -= 1),
      progressBarProgress: this.recalculateProgressBarProgress(),
    });
  };

  recalculateProgressBarProgress = () => {
    const progressBarPercent = Math.abs(
      Math.floor((this.state.gameTimeLeft * 100) / app.config.printTimeout - 100)
    );
    return progressBarPercent > 100 ? 100 : progressBarPercent;
  };

  renderProgressBar = () => {
    const progressWidthStyle = {
      width: `${this.state.progressBarProgress}%`,
    };
    return (
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressBarProgress}
            style={progressWidthStyle}
          />
        </div>
        <div className={styles.progressBarProgressText}>{`${
          this.state.progressBarProgress
          }%`}</div>
      </div>
    );
  };

  renderGame = () => <div className={styles.gameArea}>{this.renderCat()}</div>;

  renderCat = () => {
    const catPositions = [
      {
        left: 155,
        top: 16,
      },
      {
        left: 325,
        top: 16,
      },
      {
        left: 495,
        top: 16,
      },
      {
        left: 155,
        top: 188,
      },
      {
        left: 325,
        top: 188,
      },
      {
        left: 495,
        top: 188,
      },
      {
        left: 155,
        top: 359,
      },
      {
        left: 325,
        top: 359,
      },
      {
        left: 495,
        top: 359,
      },
      {
        left: 155,
        top: 531,
      },
      {
        left: 325,
        top: 531,
      },
      {
        left: 495,
        top: 531,
      },
    ];

    const catImages = {
      backgroundImage: `url(${app.imagesPath}/images/cats/cat${this.state.catType}.png)`,
    };

    let { score } = this.state;

    return (
      <Tappable
        className={styles.cat}
        style={{ ...catImages, ...catPositions[this.state.catHomeNumber] }}
        onTouchEnd={() => {
          this.relocateCat();
          this.changeCatType();
          this.setState({ score: (score += 1) });
          clearInterval(this.gameTimer);
          this.startGame();
        }}
        role="Button"
        tabIndex={-1}
      ></Tappable>
    );
  };

  renderScore = () => (
    <div className={styles.score}>
      <Translate value="score" /> {this.state.score}
    </div>
  );

  renderModal = () => (
    <Modal
      isOpen={this.state.modalIsOpen}
      onAfterOpen={this.afterOpenModal}
      onRequestClose={this.closeModal}
      shouldCloseOnOverlayClick={false}
      style={customStyles}
      contentLabel="Example Modal"
    >
      <div>
        <Translate value="yourScore" score={this.state.score} />
      </div>
      {/*<Tappable component="div" className={styles.confirm} onTouchEnd={this.closeModal}>
        ОК
      </Tappable>*/}
    </Modal>
  );

  render() {

    // console.log (this.state.game2);
    return (
      <div className={styles.mainContainer} scrolling="no">
        <div className={styles.headerContainer}>
          <Translate
            className={styles.title}
            value="waitUntilWePrepareYourOrder"
          />
          {this.renderProgressBar()}

        </div>
        <div align="center" className={styles.game2}>
          <frameset frameBorder="no" framespacing="0">
             {/* <frame src="containers/PlaceOrder/game/1.html" frameborder="yes" frameborder = "2"/> */}{/*  */}
              <frame src={this.state.game2} marginWidth="0" marginHeight="0" scrolling="no" noresize="true"/>
             {/* <noframes>Фрейм игры не поддерживается браузером</noframes> */}
           </frameset>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    coinFrontSide: state.cartReducer.toJS().coinFrontSide,
    coinBackSide: state.cartReducer.toJS().coinBackSide,
    magneticCase: state.cartReducer.toJS().magneticCase,
    payInfo: state.cartReducer.toJS().payInfo,
  };
}

const actions = { navigateTo, setPayInfo };

export default connect(
  mapStateToProps,
  actions
)(PlaceOrder);
