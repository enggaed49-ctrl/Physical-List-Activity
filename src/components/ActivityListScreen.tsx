import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
  ChevronRight,
  Table as TableIcon,
  LayoutList,
  Sparkles,
} from 'lucide-react';
import { Activity, ActivityFilter } from '../types';
import { formatDateDisplay, formatDuration } from '../utils/formatters';
import { getActivityIcon, getStatusMeta, getCategoryColor } from '../utils/activityIcons';

interface ActivityListScreenProps {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onAddNew: () => void;
  onLoadSampleData?: () => void;
}

export const ActivityListScreen: React.FC<ActivityListScreenProps> = ({
  activities,
  onSelectActivity,
  onAddNew,
  onLoadSampleData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ActivityFilter>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [desktopViewMode, setDesktopViewMode] = useState<'table' | 'cards'>('table');

  const filteredActivities = useMemo(() => {
    return activities
      .filter((act) => {
        if (selectedFilter !== 'All' && act.status !== selectedFilter) {
          return false;
        }
        if (selectedCategory !== 'All' && (act.category || 'Cardio') !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = act.name.toLowerCase().includes(q);
          const matchesDesc = act.description?.toLowerCase().includes(q) || false;
          const matchesDate = act.date.toLowerCase().includes(q);
          const matchesCat = (act.category || '').toLowerCase().includes(q);
          return matchesName || matchesDesc || matchesDate || matchesCat;
        }
        return true;
      })
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        return dateDiff !== 0 ? dateDiff : b.createdAt - a.createdAt;
      });
  }, [activities, selectedFilter, selectedCategory, searchQuery]);

  const filterTabs: { label: ActivityFilter; count: number }[] = [
    { label: 'All', count: activities.length },
    { label: 'Completed', count: activities.filter((a) => a.status === 'Completed').length },
    { label: 'Ongoing', count: activities.filter((a) => a.status === 'Ongoing').length },
    { label: 'Not Started', count: activities.filter((a) => a.status === 'Not Started').length },
  ];

  const categories = ['All', 'Cardio', 'Strength', 'Flexibility', 'Sports', 'Recovery', 'Other'];

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Activities
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'} recorded
          </p>
        </div>

        <button
          id="list-add-header-btn"
          type="button"
          onClick={onAddNew}
          className="w-full sm:w-auto min-h-[48px] sm:min-h-[42px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.4]" />
          <span>Log Activity</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input (large 48px on mobile) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="activity-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities by name, category, or notes..."
              className="w-full h-12 md:h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 text-base md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Select */}
          <select
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-12 md:h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base md:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-600"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Desktop View Mode Toggle */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              id="view-mode-table-btn"
              type="button"
              onClick={() => setDesktopViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                desktopViewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              id="view-mode-cards-btn"
              type="button"
              onClick={() => setDesktopViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                desktopViewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.label;
            return (
              <button
                key={tab.label}
                id={`filter-tab-${tab.label.toLowerCase().replace(' ', '-')}`}
                type="button"
                onClick={() => setSelectedFilter(tab.label)}
                className={`min-h-[40px] md:min-h-[34px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono tabular-nums text-[11px] opacity-75">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {activities.length === 0 ? 'Your activity list is empty' : 'No matching activities found'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {activities.length === 0
              ? 'Log a workout session to start building your personal activity history.'
              : 'Try adjusting your search query, status filter, or category selection.'}
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onAddNew}
              className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Activity</span>
            </button>
            {activities.length === 0 && onLoadSampleData && (
              <button
                type="button"
                onClick={onLoadSampleData}
                className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Starter Examples</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* DESKTOP DATA TABLE VIEW */}
          {desktopViewMode === 'table' && (
            <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Activity</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Duration</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredActivities.map((act) => {
                    const statusMeta = getStatusMeta(act.status);
                    return (
                      <tr
                        key={act.id}
                        id={`activity-row-${act.id}`}
                        onClick={() => onSelectActivity(act)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              {getActivityIcon(act.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {act.name}
                              </p>
                              {act.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                  {act.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`py-3.5 px-4 font-medium ${getCategoryColor(act.category)}`}>
                          {act.category || 'Cardio'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono tabular-nums text-xs">
                          {formatDateDisplay(act.date)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                          {formatDuration(act.durationMinutes)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusMeta.textClass}`}>
                            {statusMeta.icon}
                            <span>{statusMeta.label}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* DESKTOP MULTI-COLUMN CARD GRID (when Grid toggled) */}
          {desktopViewMode === 'cards' && (
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActivities.map((act) => {
                const statusMeta = getStatusMeta(act.status);
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => onSelectActivity(act)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 text-left transition-colors cursor-pointer flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          {getActivityIcon(act.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                            {act.name}
                          </h3>
                          <p className={`text-xs font-medium ${getCategoryColor(act.category)}`}>
                            {act.category || 'Cardio'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>

                    {act.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {act.description}
                      </p>
                    )}

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {formatDateDisplay(act.date)} · {formatDuration(act.durationMinutes)}
                      </span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${statusMeta.textClass}`}>
                        {statusMeta.icon}
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* MOBILE SINGLE-COLUMN TAP LIST (Ergonomic thumb targets) */}
          <div className="md:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {filteredActivities.map((act) => {
              const statusMeta = getStatusMeta(act.status);
              return (
                <button
                  key={act.id}
                  id={`mobile-activity-card-${act.id}`}
                  type="button"
                  onClick={() => onSelectActivity(act)}
                  className="w-full min-h-[72px] p-4 flex items-center justify-between gap-3 active:bg-slate-50 dark:active:bg-slate-800 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      {getActivityIcon(act.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {act.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span className={`font-medium ${getCategoryColor(act.category)}`}>
                          {act.category || 'Cardio'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDateDisplay(act.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{formatDuration(act.durationMinutes)}</span>
                      </div>
                      <div className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 ${statusMeta.textClass}`}>
                        {statusMeta.icon}
                        <span>{statusMeta.label}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
