const calendarUtils = require('../../utils/calendar-utils');

Page({
  data: {
    year: 0,
    month: 0,
    days: [],
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    selectedDate: '',
    selectedDateStr: '',
    lunarDateStr: '农历日期',
    events: [],
    allEvents: {
      '2026-03-17': [
        { id: 1, time: '08:00', title: '早餐服药', desc: '降压药 1 粒' },
        { id: 2, time: '14:00', title: '社区活动', desc: '象棋比赛' }
      ]
    }
  },

  onLoad() {
    const today = new Date();
    this.setData({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      selectedDate: this.formatDate(today)
    });
    this.generateCalendar();
    this.updateSchedule(this.data.selectedDate);
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  generateCalendar() {
    const { year, month } = this.data;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    let days = [];

    // 上个月的补位
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        type: 'prev-month',
        date: ''
      });
    }

    // 当月日期
    const todayStr = this.formatDate(new Date());
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const festival = calendarUtils.getFestival(year, month, i);
      const lunar = calendarUtils.getLunar(year, month, i);
      
      days.push({
        day: i,
        type: 'current-month',
        date: dateStr,
        isToday: dateStr === todayStr,
        selected: dateStr === this.data.selectedDate,
        hasEvent: !!this.data.allEvents[dateStr],
        festival: festival,
        lunar: lunar,
        showText: festival || (i === 1 ? `${month}月` : i) // 优先显示节日，否则显示日期
      });
    }

    // 下个月补位
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        type: 'next-month',
        date: ''
      });
    }

    this.setData({ days });
  },

  prevMonth() {
    let { year, month } = this.data;
    if (month === 1) {
      year--;
      month = 12;
    } else {
      month--;
    }
    this.setData({ year, month });
    this.generateCalendar();
  },

  nextMonth() {
    let { year, month } = this.data;
    if (month === 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
    this.setData({ year, month });
    this.generateCalendar();
  },

  goToToday() {
    const today = new Date();
    this.setData({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      selectedDate: this.formatDate(today)
    });
    this.generateCalendar();
    this.updateSchedule(this.data.selectedDate);
  },

  selectDate(e) {
    const { date, type } = e.currentTarget.dataset;
    if (!date) return;
    
    if (type === 'prev-month') this.prevMonth();
    if (type === 'next-month') this.nextMonth();

    this.setData({ selectedDate: date });
    this.generateCalendar();
    this.updateSchedule(date);
  },

  updateSchedule(dateStr) {
    const events = this.data.allEvents[dateStr] || [];
    const dateObj = new Date(dateStr);
    const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dateObj.getDay()];
    
    // 获取当天的节日和农历
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const festival = calendarUtils.getFestival(year, month, day);
    const lunar = calendarUtils.getLunar(year, month, day);
    const lunarStr = festival ? `${festival} · ${lunar}` : `农历${lunar}`;

    this.setData({
      events,
      selectedDateStr: `${dateStr} ${weekDay}`,
      lunarDateStr: lunarStr
    });
  }
});