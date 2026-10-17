import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ClipboardList,
  Filter,
  Table as TableIcon,
  LayoutList
} from 'lucide-react';
import { Activity, ActivityFilter } from '../types';
import { formatDateDisplay, formatDuration } from '../data/initialActivities';
import { getActivityIcon, getStatusBadge, getCategoryBadge } from '../utils/activityIcons';

interface ActivityListScreenProps {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onAddNew: () => void;
}

export const ActivityListScreen: React.FC<ActivityListScreenProps> = ({
  activities,
  onSelectActivity,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ActivityFilter>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Filtered & searched activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Filter tab check
      if (selectedFilter !== 'All' && act.status !== selectedFilter) {
        return false;
      }
      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = act.name.toLowerCase().includes(q);
        const matchesDesc = act.description?.toLowerCase().includes(q) || false;
        const matchesDate = act.date.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesDate;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities, selectedFilter, searchQuery]);

  const filterTabs: { label: ActivityFilter; count: number }[] = [
    { label: 'All', count: activities.length },
    { label: 'Completed', count: activities.filter((a) => a.status === 'Completed').length },
    { label: 'Ongoing', count: activities.filter((a) => a.status === 'Ongoing').length },
    { label: 'Not Started', count: activities.filter((a) => a.status === 'Not Started').length },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-3 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              My Activities
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activities.length} total recorded {activities.length === 1 ? 'activity' : 'activities'}
            </p>
          </div>
          <button
            id="list-add-header-btn"
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Activity</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="activity-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs & View Mode Toggle */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs flex-1">
            {filterTabs.map((tab) => {
              const isActive = selectedFilter === tab.label;
              return (
                <button
                  key={tab.label}
                  id={`filter-tab-${tab.label.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setSelectedFilter(tab.label)}
                  className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Toggle: Table vs Cards */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 border border-slate-200/60 dark:border-slate-700">
            <button
              id="view-mode-table-btn"
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              id="view-mode-cards-btn"
              onClick={() => setViewMode('cards')}
              title="Card View"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activities Scroll Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-20">
        {activities.length === 0 ? (
          /* Empty State (Prompt 10: Empty Activity List Screen) */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {/* Large Activity Illustration */}
            <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 ring-8 ring-blue-50/50 dark:ring-blue-950/40 shadow-inner">
              <ClipboardList className="w-12 h-12 stroke-[1.5]" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              No activities yet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              Tap the + button to add your first activity and start tracking your fitness journey.
            </p>
            <button
              id="empty-add-btn"
              onClick={onAddNew}
              className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Your First Activity</span>
            </button>
          </div>
        ) : filteredActivities.length === 0 ? (
          /* No Search Results */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No activities match</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your search query or switching filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('All');
              }}
              className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table id="activities-data-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/70 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5">Activity</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredActivities.map((act) => {
                    const statusInfo = getStatusBadge(act.status);
                    const categoryInfo = getCategoryBadge(act.category);
                    return (
                      <tr
                        key={act.id}
                        id={`table-row-${act.id}`}
                        onClick={() => onSelectActivity(act)}
                        className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              {getActivityIcon(act.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
                                  {act.name}
                                </p>
                                {act.category && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${categoryInfo.bg}`}>
                                    {act.category}
                                  </span>
                                )}
                              </div>
                              {act.description && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[140px] sm:max-w-[200px]">
                                  {act.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDateDisplay(act.date)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDuration(act.durationMinutes)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectActivity(act);
                            }}
                            className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                            title="View details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Showing {filteredActivities.length} of {activities.length} activities</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">Tap any row to view / edit</span>
            </div>
          </div>
        ) : (
          /* CARD VIEW */
          filteredActivities.map((act) => {
            const statusInfo = getStatusBadge(act.status);
            const categoryInfo = getCategoryBadge(act.category);
            return (
              <div
                key={act.id}
                id={`activity-card-${act.id}`}
                onClick={() => onSelectActivity(act)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Activity Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                    {getActivityIcon(act.name)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {act.name}
                      </h3>
                      {act.category && (
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${categoryInfo.bg}`}>
                          {act.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="truncate">{formatDateDisplay(act.date)}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>{formatDuration(act.durationMinutes)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Arrow */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                    <span>{statusInfo.label}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating '+' Add Button (Prominent mobile pattern) */}
      <button
        id="floating-add-btn"
        onClick={onAddNew}
        aria-label="Add activity"
        className="absolute right-5 bottom-4 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all z-10"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
