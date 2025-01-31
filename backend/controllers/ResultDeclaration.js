import { Op } from 'sequelize';
import PurchaseLottery from '../models/purchase.model.js';
import LotteryResult from '../models/resultModel.js';
import { apiResponseErr, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import TicketRange from '../models/ticketRange.model.js';
import { TicketService } from '../constructor/ticketService.js';

export const ResultDeclare = async (req, res) => {
  try {
    const prizes = req.body;
    const { marketId } = req.params;
    const market = await TicketRange.findOne({ where: { marketId } });

    if (!market) {
      return apiResponseErr(null, false, statusCode.badRequest, 'Market not found', res);
    }

    const marketName = market.marketName;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const prizeLimits = {
      'First Prize': 1,
      'Second Prize': 10,
      'Third Prize': 10,
      'Fourth Prize': 10,
      'Fifth Prize': 50,
    };

    const allPrizeCategories = [
      'First Prize',
      'Second Prize',
      'Third Prize',
      'Fourth Prize',
      'Fifth Prize'
    ];

    const providedCategories = prizes.map(prize => prize.prizeCategory);

    // Check if all required categories are present
    const missingCategories = allPrizeCategories.filter(
      category => !providedCategories.includes(category)
    );

    if (missingCategories.length > 0) {
      return apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        `The following prize categories are missing: ${missingCategories.join(', ')}`,
        res
      );
    }

    let generatedTickets = [];
    let lastFiveForFirstPrize = null;
    let lastFourForFirstPrize = null;
    let lastFourForSecondPrize = null;
    let lastFourForThirdPrize = null;
    let lastFourForFourthPrize = null;

    // Loop through each prize and declare results
    for (let prize of prizes) {
      const { ticketNumber, prizeCategory, prizeAmount, complementaryPrize } = prize;

      // Check prize category validity
      if (!prizeLimits[prizeCategory]) {
        return apiResponseErr(null, false, statusCode.badRequest, 'Invalid prize category.', res);
      }

      // Ensure the correct number of tickets for each prize category
      const ticketNumbers = Array.isArray(ticketNumber) ? ticketNumber : [ticketNumber];
      if (ticketNumbers.length !== prizeLimits[prizeCategory]) {
        return apiResponseErr(
          null,
          false,
          statusCode.badRequest,
          `The ${prizeCategory} requires exactly ${prizeLimits[prizeCategory]} ticket number(s).`,
          res,
        );
      }

      // Check for ticket number duplicates across different prize categories
      const allResults = await LotteryResult.findAll({
        where: {
          createdAt: {
            [Op.between]: [todayStart, todayEnd],
          },
          marketId
        }
      });
      const isDuplicate = ticketNumbers.some(ticket =>
        allResults.some(result => result.ticketNumber.includes(ticket))
      );

      if (isDuplicate) {
        return apiResponseErr(
          null,
          false,
          statusCode.badRequest,
          'One or more ticket numbers have already been assigned a prize in another category.',
          res,
        );
      }

      // Check if we have already reached the limit for this prize category
      const existingResults = await LotteryResult.findAll({
        where: { prizeCategory, marketId },
      });

      if (existingResults.length >= prizeLimits[prizeCategory]) {
        return apiResponseErr(
          null,
          false,
          statusCode.badRequest,
          `Cannot add more ticket numbers. ${prizeCategory} already has the required tickets.`,
          res,
        );
      }

      // Handle different prize categories
      if (prizeCategory === 'First Prize') {
        const firstTicket = ticketNumbers[0];
        const lastFive = firstTicket.slice(-5);
        const lastFour = firstTicket.slice(-4);
        lastFiveForFirstPrize = lastFive;
        lastFourForFirstPrize = lastFour
        generatedTickets.push({
          resultId: uuidv4(),
          marketId,
          ticketNumber: ticketNumbers,
          marketName,
          prizeCategory,
          prizeAmount,
          complementaryPrize,
        });
      }

      if (prizeCategory === 'Second Prize') {
        const secondTicket = ticketNumbers[0];
        const lastFive = secondTicket.slice(-5);
        if (lastFive !== lastFiveForFirstPrize) {
          lastFourForSecondPrize = lastFive;
          generatedTickets.push({
            resultId: uuidv4(),
            marketId,
            marketName,
            ticketNumber: ticketNumbers,
            prizeCategory,
            prizeAmount,
          });
        } else {
          return apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            'Ticket number must be unique',
            res,
          );
        }
      }

      if (prizeCategory === 'Third Prize') {
        const thirdTicket = ticketNumbers[0];
        const lastFour = thirdTicket.slice(-4);
        if (lastFour !== lastFiveForFirstPrize && lastFour !== lastFourForSecondPrize && lastFour !== lastFourForFirstPrize) {
          lastFourForThirdPrize = lastFour;
          generatedTickets.push({
            resultId: uuidv4(),
            marketId,
            marketName,
            ticketNumber: ticketNumbers,
            prizeCategory,
            prizeAmount,
          });
        } else {
          return apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            'Ticket number must be unique',
            res,
          );
        }
      }

      if (prizeCategory === 'Fourth Prize') {
        const fourthTicket = ticketNumbers[0];
        const lastFour = fourthTicket.slice(-4);
        if (
          lastFour !== lastFiveForFirstPrize &&
          lastFour !== lastFourForSecondPrize &&
          lastFour !== lastFourForThirdPrize &&
          lastFour !== lastFourForFirstPrize
        ) {
          lastFourForFourthPrize = lastFour;
          generatedTickets.push({
            resultId: uuidv4(),
            marketId,
            marketName,
            ticketNumber: ticketNumbers,
            prizeCategory,
            prizeAmount,
          });
        } else {
          return apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            'Ticket number must be unique',
            res,
          );
        }
      }

      if (prizeCategory === 'Fifth Prize') {
        const fifthTicket = ticketNumbers[0];
        const lastFour = fifthTicket.slice(-4);
        if (
          lastFour !== lastFiveForFirstPrize &&
          lastFour !== lastFourForSecondPrize &&
          lastFour !== lastFourForThirdPrize &&
          lastFour !== lastFourForFourthPrize &&
          lastFour !== lastFourForFirstPrize
        ) {
          generatedTickets.push({
            resultId: uuidv4(),
            marketId,
            marketName,
            ticketNumber: ticketNumbers,
            prizeCategory,
            prizeAmount,
          });
        } else {
          return apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            'Ticket number must be unique',
            res,
          );
        }
      }

      const marketData = await PurchaseLottery.findOne({
        attributes: ['sem', 'group', 'series', 'number'],
        where: { marketId },
      });

      if (marketData) {
        const { sem, group, series, number } = marketData;

        const ticketService = new TicketService();

        const ticketConditions = await Promise.all(
          ticketNumbers.map(async (ticket) => {
            const [ticketGroup, ticketSeries, ticketNumber] = ticket.split(" ");

            if (prizeCategory === 'First Prize') {
              await ticketService.list(group, series, number, sem, marketId);

              return {
                group: ticketGroup,
                series: ticketSeries,
                number: ticketNumber,
              };
            } else if (prizeCategory === 'Second Prize') {
              return { number: { [Op.like]: `%${ticket.slice(-5)}` } };
            } else {
              return { number: { [Op.like]: `%${ticket.slice(-4)}` } };
            }
          })
        );

        const matchedTickets = await PurchaseLottery.findAll({
          where: {
            marketId,
            createdAt: {
              [Op.between]: [todayStart, todayEnd],
            },
            [Op.or]: ticketConditions,
          },
        });

        if (matchedTickets.length > 0) {
          const userProfitLossMap = {};
          const processedUsers = new Set(); // Track processed users

          matchedTickets.forEach(({ userId, lotteryPrice }) => {
            if (!userProfitLossMap[userId]) {
              userProfitLossMap[userId] = { totalProfitLoss: 0, totalPrice: 0 };
            }
            userProfitLossMap[userId].totalPrice += Number(lotteryPrice);
          });


          for (const ticket of matchedTickets) {
            const { userId, sem, userName, marketName, number, lotteryPrice } = ticket;
            // Skip processing if the user has already been processed
            if (processedUsers.has(userId)) {
              console.log(`Skipping userId ${userId} as it's already processed.`);
              continue;
            }

            const totalPrize =
              prizeCategory === 'First Prize'
                ? prizeAmount
                : sem * prizeAmount;

            const userProfitLoss = userProfitLossMap[ticket.userId];


            if (!userProfitLoss) continue;

            const { totalPrice } = userProfitLoss;


            processedUsers.add(userId);

            const totalPrizeForUser = totalPrize * matchedTickets.filter(t => t.userId === userId).length;

            const baseURL = process.env.COLOR_GAME_URL;
            const response = await axios.post(`${baseURL}/api/users/update-balance`, {
              userId,
              prizeAmount: totalPrizeForUser,
              marketId,
              lotteryPrice: totalPrice
            });

            const res = await axios.post(`${baseURL}/api/lottery-profit-loss`, {
              userId,
              userName,
              marketId,
              marketName,
              ticketNumber: number,
              price: totalPrice,
              sem,
              profitLoss: totalPrizeForUser,
            });

            if (!response.data.success) {
              return apiResponseErr(
                null,
                false,
                statusCode.badRequest,
                `Failed to update balance for userId ${userId}.`,
                res
              );
            }

            console.log(`Balance updated for userId ${userId}:`, response.data);
          }
        }

        else {
          const usersWithPurchases = await PurchaseLottery.findAll({
            where: { marketId },
            attributes: ['userId', 'marketName', 'marketId'],
          });

          const userIds = [...new Set(usersWithPurchases.map((user) => user.userId))];

          for (const userId of userIds) {
            const baseURL = process.env.COLOR_GAME_URL;
            const response = await axios.post(`${baseURL}/api/users/remove-exposer`, {
              userId,
              marketId,
              marketName,
            });

            if (!response.data.success) {
              return apiResponseErr(
                null,
                false,
                statusCode.badRequest,
                `Failed to update balance for userId ${userId}.`,
                res
              );
            }
          }
        }
      }
    }
    let savedResults

    if (generatedTickets.length > 0) {
      savedResults = await LotteryResult.bulkCreate(generatedTickets);
    } else {
      return apiResponseErr(null, false, statusCode.badRequest, 'No valid tickets to save.', res);
    }

    const declaredPrizes = await LotteryResult.findAll({
      where: { marketId },
      attributes: ['prizeCategory'],
      raw: true,
    });

    const declaredPrizeCategories = declaredPrizes.map((prize) => prize.prizeCategory);

    const isAllPrizesDeclared = allPrizeCategories.every((category) =>
      declaredPrizeCategories.includes(category)
    );

    if (isAllPrizesDeclared) {
      await TicketRange.update(
        { isActive: false, isWin: true },
        { where: { marketId } }
      );
    }
    await TicketRange.update(
      { winReference: true },
      { where: { marketId } }
    );
    await PurchaseLottery.update(
      { resultAnnouncement: true, settleTime: new Date() },
      { where: { marketId } }
    );

    return apiResponseSuccess(savedResults, true, statusCode.create, 'Lottery results saved successfully.', res);

  } catch (error) {
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
  }
};

export const getLotteryResults = async (req, res) => {
  try {
    const { marketId } = req.params;

    const results = await LotteryResult.findAll({
      where: { marketId },
    });

    if (results.length === 0) {
      return apiResponseSuccess(
        [],
        true,
        statusCode.success,
        `No lottery results found.`,
        res
      );
    }

    return apiResponseSuccess(results, true, statusCode.success, 'Lottery results fetched successfully.', res);
  } catch (error) {
    return apiResponseErr(
      null,
      false,
      statusCode.internalServerError,
      error.message,
      res
    );
  }
};

export const getMultipleLotteryResults = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = await LotteryResult.findAll({
      attributes: ["marketId", "marketName", "ticketNumber", "prizeCategory", "prizeAmount", "complementaryPrize", "createdAt"],
      where: {
        createdAt: {
          [Op.gte]: today,
        },
      },
    });

    if (results.length === 0) {
      return apiResponseSuccess(
        {},
        false,
        statusCode.success,
        `No lottery results found for today.`,
        res
      );
    }

    const structuredResults = {};

    results.forEach((result) => {
      const marketName = result.marketName;
      if (!structuredResults[marketName]) {
        structuredResults[marketName] = [];
      }

      structuredResults[marketName].push({
        ticketNumber: Array.isArray(result.ticketNumber) ? result.ticketNumber : [result.ticketNumber],
        prizeCategory: result.prizeCategory,
        prizeAmount: result.prizeAmount,
        complementaryPrize: result.complementaryPrize || 0,
        marketName: marketName,
        marketId: result.marketId,
      });
    });

    return apiResponseSuccess(
      structuredResults,
      true,
      statusCode.success,
      "Lottery results fetched successfully.",
      res
    );
  } catch (error) {
    return apiResponseErr(
      null,
      false,
      statusCode.internalServerError,
      error.message,
      res
    );
  }
};





