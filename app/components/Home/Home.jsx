import electron from 'electron';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import Styles from './Home.scss';

const app = electron.remote.app;

const video = app.imagesPath + '/video/video.mov';

class Home extends Component {
  componentDidMount() {
    if (app.payment && !app.config.disablePayment && !app.config.nextDisablePayment)
      app.payment.enable && app.payment.enable();
    app.log('---> Home <---');
    electron.remote.app.monitoring.currentPage = 'Home';
  }

  render() {
    return (
      <div>
        <Link to="/language_select">
          <video
            controls={false}
            width="760"
            height="1360"
            loop={true}
            autoPlay
            className={Styles.video}
          >
            <source src={video} type="video/mp4" />
          </video>
        </Link>
      </div>
    );
  }
}

export default connect()(Home);
