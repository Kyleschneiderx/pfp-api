import cron from 'node-cron';

export default class Scheduler {
    constructor({ logger, tasks }) {
        this.tasks = tasks;
        this.logger = logger;
    }

    /**
     * Run task scheduler
     *
     * @param {object[]} tasks
     * @param {string} tasks[].name Task name
     * @param {string} tasks[].schedule Task schedule in cron format
     * @param {function} tasks[].process Task callback
     * @returns {void}
     */
    run(tasks) {
        if (tasks !== undefined && tasks.length > 0) this.tasks = tasks;

        if (this.tasks.length === 0) return;

        this.logger.info('Task scheduler is starting');

        tasks.forEach((task) => {
            this.logger.info(`Task [${task.name}] registered`);

            cron.schedule(task.schedule, task.process);
        });
    }
}
