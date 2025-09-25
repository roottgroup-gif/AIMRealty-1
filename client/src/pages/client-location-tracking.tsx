import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Calendar, Users, Globe, Smartphone, Target, TrendingUp, Filter, BarChart3, PieChart, Activity } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import type { ClientLocation } from '@shared/schema';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Hook for client location analytics
const useClientLocationAnalytics = (filters: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ['/api/admin/client-locations/stats', filters],
    enabled: true
  });
};

// Hook for client locations data
const useClientLocations = (filters: { from?: string; to?: string; userId?: string; page: number; limit: number }) => {
  return useQuery({
    queryKey: ['/api/admin/client-locations', {
      from: filters.from || undefined,
      to: filters.to || undefined,
      userId: filters.userId === 'all' ? undefined : filters.userId,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit
    }],
    enabled: true
  });
};

// Hook for users list
const useUsers = () => {
  return useQuery({
    queryKey: ['/api/admin/users'],
    enabled: true
  });
};

export default function ClientLocationTracking() {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<ClientLocation | null>(null);
  const limit = 50;

  // Data queries
  const { data: analyticsData, isLoading: analyticsLoading } = useClientLocationAnalytics({
    from: fromDate || undefined,
    to: toDate || undefined
  });

  const { data: locationsData, isLoading: locationsLoading } = useClientLocations({
    from: fromDate,
    to: toDate,
    userId: selectedUserId,
    page: currentPage,
    limit
  });

  const { data: usersData } = useUsers();

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCoordinate = (coord: string | number) => {
    return typeof coord === 'string' ? parseFloat(coord).toFixed(6) : coord.toFixed(6);
  };

  const getUserDisplayName = (userId: string | null) => {
    if (!userId) return 'Anonymous';
    const user = (usersData as any)?.items?.find((u: any) => u.id === userId);
    if (!user) return userId;
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedUserId('all');
    setCurrentPage(1);
  };

  // Chart configurations
  const dailyChartData = {
    labels: analyticsData?.dailyStats?.map((stat: any) => stat.date) || [],
    datasets: [
      {
        label: 'Location Requests',
        data: analyticsData?.dailyStats?.map((stat: any) => stat.count) || [],
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const cityChartData = {
    labels: analyticsData?.topCities?.slice(0, 5).map((city: any) => city.city) || [],
    datasets: [
      {
        label: 'Requests by City',
        data: analyticsData?.topCities?.slice(0, 5).map((city: any) => city.count) || [],
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(249, 115, 22)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const deviceChartData = {
    labels: analyticsData?.deviceStats?.slice(0, 5).map((device: any) => device.device) || [],
    datasets: [
      {
        data: analyticsData?.deviceStats?.slice(0, 5).map((device: any) => device.count) || [],
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(249, 115, 22)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  // Data processing
  const locations = (locationsData as any)?.items || [];
  const total = (locationsData as any)?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <MapPin className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Client Location Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive tracking and analytics for client location data
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From date"
                className="border-orange-200 focus:border-orange-500"
                data-testid="input-from-date"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To date"
                className="border-orange-200 focus:border-orange-500"
                data-testid="input-to-date"
              />
            </div>
            
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full sm:w-[200px] border-orange-200 focus:border-orange-500" data-testid="select-user-filter">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {((usersData as any)?.items || []).map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Locations</p>
                  <p className="text-3xl font-bold text-orange-600">{analyticsData.totalLocations}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Accuracy</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round(analyticsData.accuracyStats.average)}m
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top City</p>
                  <p className="text-lg font-bold text-green-600">
                    {analyticsData.topCities?.[0]?.city || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {analyticsData.topCities?.[0]?.count || 0} requests
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Device</p>
                  <p className="text-lg font-bold text-purple-600">
                    {analyticsData.deviceStats?.[0]?.device || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {analyticsData.deviceStats?.[0]?.count || 0} requests
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Smartphone className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Data */}
      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Charts
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Raw Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Daily Location Requests
                </CardTitle>
                <CardDescription>
                  Timeline of location requests over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {analyticsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-500">Loading chart...</div>
                    </div>
                  ) : (
                    <Line data={dailyChartData} options={chartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Cities Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Top Cities
                </CardTitle>
                <CardDescription>
                  Most active cities by location requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {analyticsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-500">Loading chart...</div>
                    </div>
                  ) : (
                    <Bar data={cityChartData} options={chartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Device Distribution Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Device Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of devices used for location requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {analyticsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-500">Loading chart...</div>
                    </div>
                  ) : (
                    <Doughnut data={deviceChartData} options={doughnutOptions} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data">
          {/* Location Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                Location Data
              </CardTitle>
              <CardDescription>
                Detailed view of all client location records
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {locationsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-orange-600">Loading locations...</div>
                </div>
              ) : locations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <MapPin className="h-12 w-12 mb-2" />
                  <p>No location data found</p>
                  {(fromDate || toDate || selectedUserId !== 'all') && (
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-orange-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 dark:text-orange-200 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 dark:text-orange-200 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 dark:text-orange-200 uppercase tracking-wider">
                            Accuracy
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 dark:text-orange-200 uppercase tracking-wider">
                            Device Info
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 dark:text-orange-200 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 dark:text-orange-200 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-orange-100 dark:divide-gray-700">
                        {locations.map((location: ClientLocation, index: number) => (
                          <tr key={location.id} className="hover:bg-orange-50 dark:hover:bg-gray-700" data-testid={`row-location-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100" data-testid={`text-user-${index}`}>
                                {getUserDisplayName(location.userId)}
                              </div>
                              {location.userId && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {location.userId}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100" data-testid={`text-location-${index}`}>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1 text-orange-600" />
                                  {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
                                </div>
                                {location.metadata?.city && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {location.metadata.city}{location.metadata.country && `, ${location.metadata.country}`}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100" data-testid={`text-accuracy-${index}`}>
                                {location.accuracy ? `${location.accuracy}m` : 'Unknown'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100" data-testid={`text-device-${index}`}>
                                {location.metadata?.userAgent ? (
                                  <div className="max-w-xs truncate" title={location.metadata.userAgent}>
                                    {location.metadata.userAgent.split(' ')[0]}
                                  </div>
                                ) : 'Unknown'}
                                {location.metadata?.language && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Language: {location.metadata.language}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100" data-testid={`text-timestamp-${index}`}>
                                {formatDate(location.createdAt || new Date().toISOString())}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLocation(location);
                                  setShowMapModal(true);
                                }}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                data-testid={`button-show-map-${index}`}
                              >
                                <MapPin className="h-4 w-4 mr-1" />
                                Show Map
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-orange-100 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} locations
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            data-testid="button-prev-page"
                          >
                            Previous
                          </Button>
                          
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Page {currentPage} of {totalPages}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            data-testid="button-next-page"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Map Modal */}
      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className="max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Location Details
            </DialogTitle>
            <DialogDescription>
              {selectedLocation && (
                <div className="text-sm space-y-1">
                  <p><strong>User:</strong> {getUserDisplayName(selectedLocation.userId)}</p>
                  <p><strong>Coordinates:</strong> {formatCoordinate(selectedLocation.latitude)}, {formatCoordinate(selectedLocation.longitude)}</p>
                  <p><strong>Accuracy:</strong> {selectedLocation.accuracy ? `${selectedLocation.accuracy}m` : 'Unknown'}</p>
                  <p><strong>Timestamp:</strong> {formatDate(selectedLocation.createdAt || new Date().toISOString())}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 w-full h-full min-h-[400px]">
            {selectedLocation && (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(selectedLocation.longitude)-0.01},${parseFloat(selectedLocation.latitude)-0.01},${parseFloat(selectedLocation.longitude)+0.01},${parseFloat(selectedLocation.latitude)+0.01}&layer=mapnik&marker=${selectedLocation.latitude},${selectedLocation.longitude}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Location Map"
                ></iframe>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedLocation) {
                    const googleMapsUrl = `https://www.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}`;
                    window.open(googleMapsUrl, '_blank');
                  }
                }}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Open in Google Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedLocation) {
                    const osmUrl = `https://www.openstreetmap.org/?mlat=${selectedLocation.latitude}&mlon=${selectedLocation.longitude}&zoom=15`;
                    window.open(osmUrl, '_blank');
                  }
                }}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                Open in OpenStreetMap
              </Button>
            </div>
            <Button onClick={() => setShowMapModal(false)} className="bg-orange-600 hover:bg-orange-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}