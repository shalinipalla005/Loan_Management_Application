import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  Alert
} from '@mui/material';

const LoanProfileDialog = ({ open, onClose, profileLoan, loading }) => {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Loan Profile - {profileLoan?.loan_number}
          </Typography>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ maxHeight: '80vh', overflow: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <Typography>Loading loan profile...</Typography>
          </Box>
        ) : !profileLoan ? (
          <Typography>No loan data available</Typography>
        ) : (
          <Box>
            {/* Loan Summary */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>Loan Summary</Typography>
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
                <Box>
                  <Typography variant="body2">Member</Typography>
                  <Typography variant="h6">{profileLoan.member?.member_name}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2">Loan Amount</Typography>
                  <Typography variant="h6">₹{profileLoan.loan_amount?.toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2">Outstanding Principal</Typography>
                  <Typography variant="h6">₹{profileLoan.summary?.remainingPrincipal?.toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2">Outstanding Interest</Typography>
                  <Typography variant="h6">₹{profileLoan.summary?.remainingInterest?.toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2">Status</Typography>
                  <Typography variant="h6" sx={{ 
                    color: profileLoan.loan_status === 'ACTIVE' ? 'success.main' : 
                           profileLoan.loan_status === 'CLOSED' ? 'success.main' : 'warning.main' 
                  }}>
                    {profileLoan.loan_status}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2">Progress</Typography>
                  <Typography variant="h6">{profileLoan.summary?.progressPercentage}%</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Payment Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Payment Summary</Typography>
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={2}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">₹{profileLoan.summary?.totalPaid?.toLocaleString()}</Typography>
                  <Typography variant="body2">Total Paid</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main">₹{profileLoan.summary?.totalPrincipalPaid?.toLocaleString()}</Typography>
                  <Typography variant="body2">Principal Paid</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main">₹{profileLoan.summary?.totalInterestPaid?.toLocaleString()}</Typography>
                  <Typography variant="body2">Interest Paid</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">₹{profileLoan.summary?.totalSavingsPaid?.toLocaleString()}</Typography>
                  <Typography variant="body2">Savings Paid</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">₹{profileLoan.summary?.totalPenaltyPaid?.toLocaleString()}</Typography>
                  <Typography variant="body2">Penalty Paid</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Overdue Payments Alert */}
            {profileLoan.overduePayments && profileLoan.overduePayments.length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="h6">Overdue Payments ({profileLoan.overduePayments.length})</Typography>
                <Typography>This loan has {profileLoan.overduePayments.length} overdue payment(s) that require immediate attention.</Typography>
              </Alert>
            )}

            {/* Upcoming Payments */}
            {profileLoan.upcomingPayments && profileLoan.upcomingPayments.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Upcoming Payments</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Installment</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profileLoan.upcomingPayments.slice(0, 5).map((payment) => (
                        <TableRow key={payment.schedule_id}>
                          <TableCell>{payment.installment_number}</TableCell>
                          <TableCell>{new Date(payment.due_date).toLocaleDateString()}</TableCell>
                          <TableCell>₹{parseFloat(payment.total_installment).toLocaleString()}</TableCell>
                          <TableCell>₹{parseFloat(payment.paid_amount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: payment.payment_status === 'PAID' ? 'success.main' : 
                                      payment.payment_status === 'PARTIAL' ? 'warning.main' : 'error.main' 
                              }}
                            >
                              {payment.payment_status}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Payment History */}
            {profileLoan.paymentHistory && profileLoan.paymentHistory.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Payment History</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Receipt No.</TableCell>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>Principal</TableCell>
                        <TableCell>Interest</TableCell>
                        <TableCell>Savings</TableCell>
                        <TableCell>Penalty</TableCell>
                        <TableCell>Method</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profileLoan.paymentHistory.slice(0, 10).map((payment) => (
                        <TableRow key={payment.payment_id}>
                          <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                          <TableCell>{payment.receipt_number}</TableCell>
                          <TableCell>₹{parseFloat(payment.payment_amount).toLocaleString()}</TableCell>
                          <TableCell>₹{parseFloat(payment.principal_paid || 0).toLocaleString()}</TableCell>
                          <TableCell>₹{parseFloat(payment.interest_paid || 0).toLocaleString()}</TableCell>
                          <TableCell>₹{parseFloat(payment.savings_paid || 0).toLocaleString()}</TableCell>
                          <TableCell>₹{parseFloat(payment.penalty_paid || 0).toLocaleString()}</TableCell>
                          <TableCell>{payment.payment_method}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Complete Repayment Schedule */}
            {profileLoan.repaymentSchedule && profileLoan.repaymentSchedule.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Complete Repayment Schedule</Typography>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Installment</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Opening Balance</TableCell>
                        <TableCell>Principal</TableCell>
                        <TableCell>Interest</TableCell>
                        <TableCell>Savings</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profileLoan.repaymentSchedule.map((schedule) => (
                        <TableRow key={schedule.schedule_id}>
                          <TableCell>{schedule.installment_number}</TableCell>
                          <TableCell>{new Date(schedule.due_date).toLocaleDateString()}</TableCell>
                          <TableCell>₹{parseFloat(schedule.opening_balance).toLocaleString()}</TableCell>
                          <TableCell>₹{parseFloat(schedule.principal_amount).toLocaleString()}</TableCell>
                          <TableCell>₹{parseFloat(schedule.interest_amount).toLocaleString()}</TableCell>
                          <TableCell>₹{parseFloat(schedule.monthly_savings).toLocaleString()}</TableCell>
                          <TableCell>₹{parseFloat(schedule.total_installment).toLocaleString()}</TableCell>
                          <TableCell>₹{parseFloat(schedule.paid_amount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: schedule.payment_status === 'PAID' ? 'success.main' : 
                                      schedule.payment_status === 'PARTIAL' ? 'warning.main' : 'error.main' 
                              }}
                            >
                              {schedule.payment_status}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoanProfileDialog;
