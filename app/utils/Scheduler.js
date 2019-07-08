import electron from 'electron';
const app = electron.app || electron.remote.app;

let tasks = [];

exports.addTask = (name, task, interval) => {
    tasks.push([name, task, interval.split(' ')]);
}

exports.removeTask = (name) => {
    tasks = tasks.filter(t => t.name != name);
}

setInterval(() => {
    tasks.map(task => {
        let minutes = new Date().getMinutes();
        let hours = new Date().getHours();

        if (parseInt(task[2][0]) == minutes || task[2][0] == '*')
            if (parseInt(task[2][1]) == hours || task[2][1] == '*') {
                app.log(`Запущена задача '${task[0]}' по расписанию в ${hours}:${minutes}`);
                task[1]();
            }
    });
}, 1000 * 60);
